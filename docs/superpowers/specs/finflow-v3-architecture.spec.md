---
spec: finflow-v3-architecture
domain: 03-architecture
applies_to: [software-architect, full-stack-engineer, backend-engineer, frontend-engineer, data-engineer, qa-engineer, devops-engineer]
mandatory: true
---

# FinFlow V3 — Especificación de Arquitectura

> Documento normativo. En conflicto entre este spec y el código de V2, este spec gana hasta enmienda. Toda decisión material adicional se registra como ADR en `docs/adr/NNNN-titulo.md` (ver §13).
> Referencia obligatoria previa: `docs/audit/analysis-report.md` (auditoría V2 con 75 funcionalidades clasificadas y 41 hallazgos `archivo:línea`).

---

## 1. Propósito y ámbito

**Propósito.** Definir la arquitectura vinculante de FinFlow V3: un motor de inteligencia financiera multi-tenant que separa rigurosamente la capa determinística (cálculos verificables GAAP/IFRS) de la capa interpretativa (agente IA con evidencia trazable y aprobación humana obligatoria). Este documento reemplaza la arquitectura implícita de V2 (SPA pura, datos hardcoded, fórmulas con placeholders y un "AI-powered agent" que era un sistema de reglas).

**Audiencia.** Software architect, full-stack / backend / frontend / data / qa / devops engineers. Cada rol encontrará decisiones accionables y criterios de aceptación verificables.

**Alcance.**
- Capas del sistema y sus contratos.
- Modelo de datos (19 tablas PostgreSQL + RLS + ledger doble entrada).
- Contrato API REST `/api/v1` (todos los endpoints).
- Contrato `FinancialSnapshot.v1` (frontend <-> backend).
- Fórmulas financieras V3 corregidas (Income Statement, Balance Sheet, Cash Flow derivados del ledger).
- Decision Engine + AI Agent con formato de evidencia trazable.
- Roadmap en 6 fases (Fase 0 -> Fase 5) con criterios de aceptación medibles.
- Matriz de cambios por archivo V2 -> V3.
- Riesgos y ADR pendientes.

**Fuera de alcance.** Implementación de código de aplicación (rol del engineer). Comando de deploy (rol devops). Fine-tuning de modelos LLM (rol IA). Selección comercial del proveedor LLM (se registra en ADR-0007).

**Stack validado.** Frontend React 18.3 + Vite 5 (conservar UI/design system de V2), backend Node.js + Fastify, PostgreSQL 15+, Prisma, Auth0/Clerk/Supabase Auth (OIDC), Vitest + Supertest + Testing Library, GitHub Actions, Vercel (frontend) + Railway/Fly.io (backend). La selección de Fastify vs Express y de Prisma vs Drizzle se materializa en ADR-0002 y ADR-0003 junto a esta especificación (ver §11).

---

## 2. Principios de diseño (reglas binding)

### D1. Separación estricta entre cálculo determinístico e interpretación AI
El **Deterministic Financial Engine** es la única fuente de verdad numérica. Sus salidas son funciones puras, reproducibles, testables y truncation-free. El **AI Financial Agent** jamás calcula un número financiero; solo interpreta salidas del engine y cita evidencia. Cualquier afirmación del agente sin referencia a una salida del engine es inválida y debe rechazarse en frontend.

### D2. Fail-closed por defecto
Ante dato ausente, fórmula indefinida o dependencia caída, el sistema **falla explícito** con `null` o error tipado, nunca inventa un número. V2 inventaba `revenue*0.7` como Gross Profit; V3 retorna `null` y la UI muestra "N/A". El agente V2 era fail-open (sin capabilities -> todas permitidas); V3 es fail-closed (sin capabilities -> 0 acciones).

### D3. Trazabilidad de evidencia (Evidence-before-claims)
Cada afirmación del agente y cada recomendación debe incluir `evidence[]` apuntando a una salida verificable: `{source, ref, value, asOf}` (ver §8). Sin evidencia trazable, la afirmación no se renderiza.

### D4. Human Approval obligatorio
Toda acción ejecutable (recomendación aprobada, ejecución de capability, ajuste de escenario) requiere aprobación humana explícita registrada en `audit_log` (append-only). El agente propone, nunca ejecuta.

### D5. Multi-tenancy por aislamiento total
Cada query/operación va scopeada por `organization_id` y `user_id` extraídos del JWT, verificados vía RLS de PostgreSQL. Sin `organization_id` en sesión -> 401. Cero accesos cross-tenant.

### D6. Ledger doble entrada inmutable
Las transacciones se modelan como `{transaction, transaction_lines}` con débito/crédito balanceado (suma débitos == suma créditos). Las líneas son append-only; la corrección se hace con transacción de reversa (no `UPDATE`/`DELETE`). El Income Statement, Balance Sheet y Cash Flow se derivan del ledger, no de snapshots agregados.

### D7. Capas por dirección de dependencia
`presentation -> application -> domain <- infrastructure`. El dominio (financial engine, decision engine, agent contracts) no conoce frameworks ni infraestructura. La infraestructura implementa interfaces del dominio (port/adapter).

### D8. Versionado de API y contratos
Todo endpoint bajo `/api/v1/*`. Cambios breaking -> `/api/v2` simultánea con deprecación >= 6 meses. El contrato `FinancialSnapshot` se versiona por esquema (`v1`, `v2`, ...). El frontend valida el shape con zod.

### D9. Adquisición de datos por pipeline explícito
Ingestion -> Mapping -> Validation -> Preview -> Confirm -> Persist. Persistir datos exige `preview.confirm` del usuario; el backend nunca acepta un CSV directo como fuente de verdad sin el paso previo de validación.

### D10. Reversibilidad por diseño
Cada ADR declara coste de reversión. Migraciones DB son siempre aditivas; nunca `DROP COLUMN` en el mismo deployment que la feature que la usa (ventana >= 1 release).

### D11. Observabilidad desde la Fase 0
Logs estructurados (pino), OpenTelemetry traces, Sentry para errores frontend y backend, health checks `/healthz` y `/readyz`. Cálculo del financial engine redondea con `round-half-up` y se loggea la unidad mínima (USD 0.01 para moneda, 1e-6 para ratios).

### D12. Cero dependencias circulares
CI valida con `madge` o equivalente. Capa dominio no importa de capa aplicación/presentación/infraestructura.

---

## 3. Arquitectura de capas — Pipeline

```
+---------------------------------------------------------------------------------+
|                          PRESENTATION (React 18 / Vite)                          |
|  Landing - Dashboard - Analysis - Forecast - Scenarios - Risk - Imports -        |
|  Settings - AgentPanel (pending/approved/rejected) - Notifications               |
|  ErrorBoundary - NotFound - RouteGuards (auth/org)                               |
+-----------+-------------------------------------------------------+------------+
            | FinancialSnapshot.v1 (zod-validated)                  | render actions
            v                                                       ^
+---------------------------------------------------------------------------------+
|                              APPLICATION (Fastify API /api/v1)                   |
|  Controllers - Auth (OIDC JWT) - RBAC - OrgScope - Pagination - Rate limit -     |
|  zod request/response - audit_log writer - event bus                            |
+-------+-------------------------------------------------------------+----------+
        | commands/queries                                             | API DTO
        v                                                             ^
+---------------------------------------------------------------------------------+
|                                   DOMAIN (puros)                                 |
|  +------------------+  +--------------------+  +------------------------------+ |
|  | Deterministic     |  | Analytics          |  | Forecasting                  | |
|  | Financial Engine  |  | (variance, series,  |  | (OLS, HW, ARIMA, model       | |
|  | (formulas GAAP/   |  |  benchmarks)        |  |  selection, backtesting      | |
|  |  IFRS, ledger)    |  |                     |  |  MAE/RMSE/MAPE/WAPE/Bias/     | |
|  +-----+------------+  +---------+----------+  |  Coverage)                   | |
|        |                        |              +--------------+---------------+ |
|  +-----v------------+  +--------v-----------+  +-------------v--------------+  |
|  | Anomaly Engine   |  | Risk Engine        |  | Scenario Engine             |  |
|  | (IQR, STL, ESD,   |  | (covenants, LAR,    |  | (what-if assumptions;       |  |
|  |  FDR-BH)          |  |  DSCR, runway)     |  |  reuses other engines)      |  |
|  +-----+------------+  +---------+----------+  +--------------+--------------+  |
|        |                         |                             |              |
|  +-----v----------------------------------v---------------------v------------+  |
|  |                            Decision Engine                              |  |
|  |  rules over FinancialSnapshot -> Decision[] (no causal claims)         |  |
|  +-----------------------------------+-------------------------------------+  |
+--------------------------------------+---------------------------------------+
                                       | Decision[] + Evidence prerequisites
                                       v
+---------------------------------------------------------------------------------+
|                          AGENT (interpretativo, no calcula)                      |
|  AI Financial Analyst (LLM via backend proxy) -> añade hipótesis, lenguaje,      |
|  priorización; CADA afirmación ancla a evidence[] verificable; ratios            |
|  semánticos extraídos del Deterministic Engine; guardrails fail-closed;          |
|  capabilities whitelist por org; costo límite por request.                       |
+---------------------------------------+-----------------------------------------+
                                        | Recommendation{action,evidence[],risk,confidence}
                                        v
+---------------------------------------------------------------------------------+
|  HUMAN APPROVAL - AgentPanel: pending/approved/rejected; multi-approver por     |
|  severity; audit_log append-only (userId, orgId, timestamp, rationale, decision)  |
+---------------------------------------+-----------------------------------------+
                                        | approved Action
                                        v
+---------------------------------------------------------------------------------+
|  ACTIONS - Notification channels (email/SMS/web/in-app) - CSV/Excel/JSON export  |
+---------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------+
|  DATA PLATFORM (lateral, alimentador del Domain)                                |
|  Ingestion (CSV/Excel/JSON) -> Mapping -> Validation -> Preview -> Confirm ->   |
|  Persist -> PostgreSQL (ledger + snapshots) -> regenera FinancialSnapshot       |
|  (computed) en materialized view / Redis TTL 5m                                 |
+---------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------+
|  INFRASTRUCTURE - PostgreSQL 15 (RLS por org) - Redis - S3/Supabase Storage -    |
|  LLM provider (Anthropic/OpenRouter, claves en backend) - OTel collector -      |
|  Sentry - GitHub Actions - Vercel (FE) - Railway/Fly.io (BE)                     |
+---------------------------------------------------------------------------------+
```

**Límites de contexto y contratos de entrada/salida**

| Contexto | Contrato de entrada | Contrato de salida |
|---|---|---|
| Data Platform | File (CSV/Excel/JSON), plantilla mapping | `ImportJob{rows, validation[], preview}` -> persist `transactions`+`transaction_lines` |
| Deterministic Financial Engine | `Ledger` filtros (org, período) | `FinancialSnapshot.v1` (ver §6) |
| Analytics | `FinancialSnapshot[]`, benchmark dataset | `VarianceReport`, `BenchmarkReport` |
| Forecasting | `Series<T>`, `horizon`, `metric`, `confidence` | `Forecast{points[], backtest, modelUsed}` |
| Scenario Engine | `Snapshot`, `assumptions` deltas | `Scenario{adjusted snapshot, deltas}` |
| Risk Engine | `Snapshot`, `covenants[]` | `RiskReport{covenants[], runway, LAR}` |
| Decision Engine | `Snapshot`, `RiskReport`, `AnomalyReport`, `Forecast` | `Decision[]` (estructurado, sin causalidad) |
| AI Agent LLM | `Decisions + Evidence preempaquetada` | `Recommendation[]` con `evidence[]` reforzado |
| Human Approval | `Recommendation` | `AuditLogEntry` + `Action execution request` |

---

## 4. Modelo de datos — esquema PostgreSQL

> Implementación de referencia del data engineer. Resumen vinculante de las 19 tablas; el SQL DDL detallado se versiona en `infra/db/schema.sql` y migraciones Prisma `prisma/migrations/`. **RLS activo en toda tabla que contenga `organization_id`.**

### 4.1 Principios del modelo
- **Ledger doble entrada**: `transactions` + `transaction_lines` (debe equilibrar). Toda métrica del Income Statement / Balance Sheet / Cash Flow se **deriva** del ledger por consulta SQL; no se persisten agregados excepto `financial_snapshots` (caché computada con `valid_until`).
- **Multi-tenancy**: `organizations` (tenant), `users`, `memberships` (n:n con `role`), `roles` (RBAC).
- **Período contable**: `financial_periods` (fiscal months/quarters/year, status: open/closed/locked).
- **Cuentas contables**: `accounts` (chart of accounts; tipo: asset/liability/equity/revenue/expense; corriente/no corriente; flags `is_cogs`, `is_daa`, `is_capex`, `cf_category`).
- **Contrapartes**: `counterparties` (clientes/proveedores/empleados/bancos).
- **Inmutabilidad**: `audit_log` append-only; correcciones vía `transactions` de reversa (no UPDATE/DELETE en `transaction_lines`).
- **Pipeline de imports**: `imports` tracks dry-run/preview/confirmed.

### 4.2 Las 19 tablas

| # | Tabla | Propósito | PK / claves | RLS |
|---|---|---|---|---|
| 1 | `users` | Identidad app (mapea al IdP OIDC) | `id`, `email` (uk) | n/a (propia) |
| 2 | `organizations` | Tenant raíz | `id`, `slug` (uk) | n/a (catálogo) |
| 3 | `roles` | Catálogo RBAC (admin, finance, approver, viewer) | `id`, `code` (uk) | n/a |
| 4 | `memberships` | Pertenece usuario<->org con rol | (`user_id`, `org_id`) | sí (`org_id`) |
| 5 | `financial_periods` | Períodos contables por org | `id`, (`org_id`, `code`) uk | sí |
| 6 | `accounts` | Catálogo de cuentas por org (chart of accounts) | `id`, (`org_id`, `code`) uk | sí |
| 7 | `counterparties` | Clientes/proveedores/empleados/bancos | `id`, (`org_id`, `external_ref`) | sí |
| 8 | `transactions` | Asiento contable (encabezado) | `id`, `org_id`, `period_id`, `date`, `posted_at` | sí |
| 9 | `transaction_lines` | Líneas débito/crédito (doble entrada) | `id`, `transaction_id`, `account_id`, `counterparty_id`, `debit`, `credit` | sí (vía tx) |
| 10 | `invoices` | Facturas cliente/proveedor (AR/AP) | `id`, `org_id`, `counterparty_id`, `type` | sí |
| 11 | `budgets` | Presupuestos por cuenta/período | `id`, (`org_id`, `account_id`, `period_id`) uk | sí |
| 12 | `scenarios` | Escenarios what-if (assumptions jsonb) | `id`, `org_id`, `name` | sí |
| 13 | `forecasts` | Resultados de forecasting (model + series jsonb) | `id`, `org_id`, `metric`, `model_used`, `backtest jsonb` | sí |
| 14 | `covenants` | Definiciones de covenants por org | `id`, `org_id`, `metric`, `operator`, `threshold`, `severity` | sí |
| 15 | `alerts` | Notificaciones persistidas (breach, anomaly, agent) | `id`, `org_id`, `type`, `severity`, `status` | sí |
| 16 | `notification_channels` | Canales (email/sms/webhook/in-app) por user×org | `id`, `user_id`, `org_id`, `channel`, `config jsonb` | sí |
| 17 | `recommendations` | Salida del agente (pending/approved/rejected) | `id`, `org_id`, `capability`, `status`, `evidence jsonb` | sí |
| 18 | `audit_log` | Append-only inmutable | `id`, `org_id`, `user_id`, `action`, `payload jsonb`, `created_at` | sí |
| 19 | `imports` | Ingesta: dry-run/preview/confirmed + validation | `id`, `org_id`, `status`, `format`, `raw_url`, `preview jsonb` | sí |

Adicionalmente, **vista materializada `financial_snapshots`** (tabla 19+) generada cada commit de `transactions` o bajo demanda, contiene el `FinancialSnapshot.v1` JSON + `valid_until` (TTL). Se invalida por triggers o por job programado.

### 4.3 RLS — política canónica
Para cada tabla con `organization_id`:

```sql
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_isolation ON memberships
  USING (organization_id = current_setting('app.org_id')::uuid);
```

`app.org_id` se setea por sesión desde el JWT validado por la capa de aplicación (Fastify hook) antes de cada query Prisma. En `memberships` también validación de `user_id` para permisos de readback al perfil propio.

### 4.4 RBAC
- `admin` — gestiona org, memberships, integraciones, capabilities whitelist del agente.
- `finance` — importa, edita transacciones, presupuestos, escenarios, lanza forecasting.
- `approver` — aprueba/rechaza recommendations; default multi-approver (`severity=critical` requiere >=2).
- `viewer` — read-only (no puede escribir ni aprobar).

Permisos en `memberships.role_id` -> `roles.code`; chequeados en capa aplicación (hook RBAC) además de RLS (defensa en profundidad).

### 4.5 Ledger doble entrada — invariantes
```sql
-- Invariante: suma débitos == suma créditos por transacción
CONSTRAINT balanced_book CHECK (
  (SELECT COALESCE(SUM(debit), 0) FROM transaction_lines WHERE transaction_id = t.id)
  = (SELECT COALESCE(SUM(credit), 0) FROM transaction_lines WHERE transaction_id = t.id)
)
```
Invariante checkeado en commit de `transactions`; si falla -> rollback + `alerts(type='book_unbalanced')`.

---

## 5. Contrato API `/api/v1`

Convenio de respuesta estándar:
```
200/201 -> { data, meta? }
4xx     -> { error: { code, message, fields? } }
5xx     -> { error: { code: 'INTERNAL', request_id } }
```
Paginación: `?page=1&pageSize=50` -> `meta: { page, pageSize, total, totalPages }`.
Auth: `Authorization: Bearer <OIDC JWT>` (excepto `/auth/*` y `/healthz`). `X-Organization-Id` exigido en todas las mutaciones y lecturas tenant-scoped (resuelto desde JWT claim `org_id`).

### 5.1 Auth & identity

| Método | Path | Auth | Body / Respuesta |
|---|---|---|---|
| POST | `/api/v1/auth/login` | none | `{ provider, idToken }` -> `{ jwt, user{ id, email } }` |
| POST | `/api/v1/auth/refresh` | Bearer | `{}` -> `{ jwt }` |
| POST | `/api/v1/auth/logout` | Bearer | `{}` -> 204 |
| GET | `/api/v1/me` | Bearer | `user{ id, email, memberships[{ orgId, role, orgSlug }] }` |
| GET | `/api/v1/me/orgs` | Bearer | `[org{ id, slug, name, role }]` |
| POST | `/api/v1/me/orgs` | Bearer | `{ slug, name }` -> crea nueva org (admin implícito) |
| PATCH | `/api/v1/me/profile` | Bearer | `{ name, defaultOrgId, preferences }` |

### 5.2 Organizations / Memberships

| Método | Path | Auth | Body / Respuesta |
|---|---|---|---|
| GET | `/api/v1/organizations/:orgId` | Bearer+org | `org{ id, slug, name, industry, currency, fiscalYearStart }` |
| PATCH | `/api/v1/organizations/:orgId` | Bearer+admin | `org` con campos editables |
| GET | `/api/v1/organizations/:orgId/memberships` | Bearer+org | `[membership{ userId, email, role }]` |
| POST | `/api/v1/organizations/:orgId/memberships` | Bearer+admin | `{ email, role }` -> invitation |
| PATCH | `/api/v1/organizations/:orgId/memberships/:userId` | Bearer+admin | `{ role }` |
| DELETE | `/api/v1/organizations/:orgId/memberships/:userId` | Bearer+admin | 204 |
| GET | `/api/v1/organizations/:orgId/roles` | Bearer+org | `[role{ code, permissions[] }]` |

### 5.3 Financial periods / Accounts / Counterparties

| Método | Path | Auth | Body / Respuesta |
|---|---|---|---|
| GET | `/api/v1/organizations/:orgId/periods` | Bearer+org | `[period{ id, code, start, end, status }]` |
| POST | `/api/v1/organizations/:orgId/periods` | Bearer+finance | `period` (uno o bulk) |
| PATCH | `/api/v1/organizations/:orgId/periods/:id` | Bearer+admin | `{ status: 'closed|locked' }` |
| GET | `/api/v1/organizations/:orgId/accounts` | Bearer+org | `[account{ id, code, name, type, current }]` |
| POST | `/api/v1/organizations/:orgId/accounts` | Bearer+admin | `account` |
| GET | `/api/v1/organizations/:orgId/counterparties` | Bearer+org | lista paginada |

### 5.4 Transactions (ledger)

| Método | Path | Auth | Body / Respuesta |
|---|---|---|---|
| GET | `/api/v1/organizations/:orgId/transactions` | Bearer+org | paginado + filtros `periodId, accountId, from, to` |
| GET | `/api/v1/organizations/:orgId/transactions/:id` | Bearer+org | `transaction{ lines[] }` |
| POST | `/api/v1/organizations/:orgId/transactions` | Bearer+finance | `{ date, periodId, lines[{ accountId, debit, credit, counterpartyId? }] }` -> 201 (valida balance en servidor, atómico) |
| POST | `/api/v1/organizations/:orgId/transactions/:id/reverse` | Bearer+finance | crea transacción de reversa referenciando la original (immutabilidad) |

### 5.5 Budgets / Invoices

| Método | Path | Auth | Body / Respuesta |
|---|---|---|---|
| GET/POST/PATCH | `/api/v1/organizations/:orgId/budgets` | Bearer+finance | por cuenta×período |
| GET/POST | `/api/v1/organizations/:orgId/invoices` | Bearer+finance | `invoice{ type, counterpartyId, total, status, dueDate }` |

### 5.6 Scenarios / Forecasts

| Método | Path | Auth | Body / Respuesta |
|---|---|---|---|
| GET | `/api/v1/organizations/:orgId/scenarios` | Bearer+org | lista de escenarios |
| POST | `/api/v1/organizations/:orgId/scenarios` | Bearer+finance | `{ name, assumptions: { revenueShock, expenseInflation, dsoDays, interestRate, ... }, basePeriodId }` -> `Scenario{ adjustedSnapshot }` (computa side-effects en servidor) |
| GET | `/api/v1/organizations/:orgId/scenarios/:id` | Bearer+org | snapshot comparado con baseline |
| POST | `/api/v1/organizations/:orgId/forecasts` | Bearer+finance | `{ metric, horizon, confidence, strategy? }` -> `Forecast{ points[], modelUsed, backtest }`. `strategy` puede omitirse -> auto-selection |
| GET | `/api/v1/organizations/:orgId/forecasts/:id` | Bearer+org | persistido |
| POST | `/api/v1/organizations/:orgId/forecasts/:id/backtest` | Bearer+finance | re-cálculo de backtest retained |

### 5.7 Covenants / Alerts / NotificationChannels

| Método | Path | Auth | Body / Respuesta |
|---|---|---|---|
| GET/POST/PATCH/DELETE | `/api/v1/organizations/:orgId/covenants` | Bearer+admin | CRUD de definiciones `covenant{ metric, operator, threshold, severity }` |
| POST | `/api/v1/organizations/:orgId/covenants/evaluate` | Bearer+finance | `{ snapshotId|periodId }` -> `eval[]` con `passed/breach/warning`, emite `alerts` para breaches |
| GET | `/api/v1/organizations/:orgId/alerts` | Bearer+org | paginado, filtros `type, severity, status` |
| PATCH | `/api/v1/organizations/:orgId/alerts/:id` | Bearer+org | `{ status: 'acknowledged|resolved' }` |
| GET/POST/PATCH/DELETE | `/api/v1/organizations/:orgId/notifications/channels` | Bearer+admin | canales por usuario |

### 5.8 Recommendations / AuditLog

| Método | Path | Auth | Body / Respuesta |
|---|---|---|---|
| GET | `/api/v1/organizations/:orgId/recommendations` | Bearer+org | `pending/approved/rejected` filtros |
| POST | `/api/v1/organizations/:orgId/recommendations/:id/approve` | Bearer+approver | `{ comment }` -> cambia estado + `audit_log` |
| POST | `/api/v1/organizations/:orgId/recommendations/:id/reject` | Bearer+approver | `{ comment }` |
| GET | `/api/v1/organizations/:orgId/audit-log` | Bearer+admin | paginado, filtros `userId, action, from, to` |

### 5.9 Imports (Data Platform)

| Método | Path | Auth | Body / Respuesta |
|---|---|---|---|
| POST | `/api/v1/organizations/:orgId/imports` | Bearer+finance | multipart file -> `Import{ id, status:'validating' }` |
| GET | `/api/v1/organizations/:orgId/imports/:id` | Bearer+org | `Import{ status, validation[], preview[] }` (status: validating|preview|confirmed|persisted|failed) |
| POST | `/api/v1/organizations/:orgId/imports/:id/mapping` | Bearer+finance | `{ columnMap }` -> re-valida y retorna nuevo preview |
| POST | `/api/v1/organizations/:orgId/imports/:id/confirm` | Bearer+finance | persiste transacciones del preview (atómico) -> `201 Import persisted` |
| DELETE | `/api/v1/organizations/:orgId/imports/:id` | Bearer+finance | descarta dry-run |

### 5.10 Snapshots

| Método | Path | Auth | Body / Respuesta |
|---|---|---|---|
| GET | `/api/v1/organizations/:orgId/snapshots` | Bearer+org | `?periodId=& asOf=` -> `FinancialSnapshot.v1` (caché Redis TTL 5m, invalidado en commit) |
| GET | `/api/v1/organizations/:orgId/snapshots/:periodId` | Bearer+org | snapshot del período |
| POST | `/api/v1/organizations/:orgId/snapshots/refresh` | Bearer+admin | fuerza recálculo |

### 5.11 AI Agent

| Método | Path | Auth | Body / Respuesta |
|---|---|---|---|
| POST | `/api/v1/organizations/:orgId/ai/analyze` | Bearer+org | `{ snapshotId, focus?: 'risk'|'forecast'|'covenants'|'general' }` -> `Recommendation[]` en estado `pending`, con `evidence[]` trazable |
| GET | `/api/v1/organizations/:orgId/ai/capabilities` | Bearer+admin | whitelist activa de capabilities |
| PUT | `/api/v1/organizations/:orgId/ai/capabilities` | Bearer+admin | patch whitelist (fail-closed: vacío -> 0 acciones) |
| GET | `/api/v1/organizations/:orgId/ai/explain` | Bearer+org | `?recommendationId=` -> desglose de evidence formato plano |
| GET | `/healthz`, `/readyz` | none | `{ status, version }`, `/readyz` incluye deps `db, redis, llm` |

---

## 6. `FinancialSnapshot.v1` — JSON shape (contrato frontend/backend)

```ts
type FinancialSnapshotV1 = {
  schema: "finflow.snapshot.v1";
  organizationId: string;
  periodId: string | null;
  periodStart: string;          // ISO date (YYYY-MM-DD)
  periodEnd: string;
  asOf: string;                 // ISO timestamp del cálculo
  validUntil: string;           // ISO timestamp TTL cache
  currency: string;             // ISO 4217
  scale: number;                // 1 = unidades, 1000 = miles, ...

  incomeStatement: {
    revenue: number | null;
    cogs: number | null;
    grossProfit: number | null;        // Revenue - COGS; null si COGS ausente
    grossMargin: number | null;        // (Revenue - COGS)/Revenue; null si no definible
    opex: number | null;
    depreciationAmortization: number | null;
    operatingIncome: number | null;    // GrossProfit - Opex - D&A (EBIT)
    operatingMargin: number | null;    // EBIT/Revenue
    interestExpense: number | null;
    taxExpense: number | null;
    netIncome: number | null;
    netMargin: number | null;          // NetIncome/Revenue
    marginDeltaPP: number | null;      // (netMargin_actual - netMargin_prev) en puntos %
    revenueGrowth: number | null;      // pct (decimal, NO %)
    ebitda: number | null;             // EBIT + D&A
  };

  balanceSheet: {
    currentAssets: { cash: number | null; ar: number | null; inventory: number | null; other: number | null; total: number | null; };
    nonCurrentAssets: { ppeNet: number | null; intangibles: number | null; other: number | null; total: number | null; };
    totalAssets: number | null;

    currentLiabilities: { ap: number | null; shortTermDebt: number | null; accrued: number | null; other: number | null; total: number | null; };
    longTermDebt: number | null;
    equity: number | null;
    totalLiabilitiesAndEquity: number | null;

    // Ratios derivados (todos null cuando falten componentes)
    currentRatio: number | null;
    quickRatio: number | null;
    workingCapital: number | null;
    debtToEquity: number | null;
  };

  cashFlow: {
    cfo: { operating: number | null; };
    cfi: { investing: number | null; capex: number | null; };
    cff: { financing: number | null; };
    netChangeInCash: number | null;
    endingCash: number | null;
  };

  cashFlowDerived: {
    grossBurn: number | null;           // total cash outflows del período
    netBurn: number | null;             // grossBurn - cash inflows; si >0 quema
    runwayMonths: number | null;        // endingCash / netBurn (si netBurn > 0), null si no aplicable
    dsoDays: number | null;
    dpoDays: number | null;
    dscr: number | null;                // EBITDA / (interest + principal due)
  };

  highlights: {
    totalRevenue: number | null;
    totalExpenses: number | null;        // opex + cogs + interest + tax
    cashPosition: number | null;
  };

  // Marca de origen del engine — sin esto el agente NO debe aceptar el snapshot
  engine: { version: string; commitHash: string; formulaVersion: "v3" };
};
```

**Reglas contractuales (binding)**:
1. Cualquier campo con dato ausente -> `null` (no `0`, no placeholder). La UI muestra "N/A".
2. `null` propagable: ratios que dependen de componentes `null` son `null`.
3. `revenueGrowth` se expresa como decimal (0.15 = 15%). El frontend multiplica ×100 sólo para display (`MetricCard.delta` y `fmt.percent` alineados — ver §11).
4. `marginDeltaPP` se expresa en **puntos porcentuales** (decimal: -1.5 = -1.5 pp) — no como cambio relativo del margen.
5. `engine.formulaVersion === "v3"` es gate del motor; un snapshot sin esta marca se rechaza.
6. zod schema es la única fuente de verdad del contrato; cualquier server returning snapshot sin `schema: "finflow.snapshot.v1"` -> 502.

---

## 7. Fórmulas financieras V3

> Toda fórmula opera sobre el **ledger** agregando `transaction_lines` por `account.type` y período. **Salida nula si indefinible**. El `null` se propaga.

### 7.1 Income Statement (derivado del ledger)

| Métrica | Fórmula V3 (correcta) | Fuente de datos (cuentas) | Formato salida |
|---|---|---|---|
| Revenue | Σ `credit` en accounts `type='revenue'` del período | revenue accounts | amount, scale |
| COGS | Σ `debit` en accounts `type='expense'` flagged `is_cogs=true` | expense accounts (cogs flag) | amount o `null` si ausente |
| Gross Profit | `Revenue - COGS` | derivado | amount o `null` si COGS null |
| Gross Margin | `(Revenue - COGS)/Revenue` | derivado | ratio decimal o `null` |
| OpEx | Σ `debit` en accounts `type='expense'` y `is_cogs=false` y `is_daa=false` | expense accounts | amount |
| D&A | Σ `debit` en accounts `is_daa=true` | expense accounts | amount |
| Operating Income (EBIT) | `GrossProfit - OpEx - D&A` | derivado | amount o `null` si GP null |
| Operating Margin | `EBIT/Revenue` | derivado | ratio decimal o `null` |
| Interest Expense | Σ `debit` en accounts `subtype='interest'` | expense accounts | amount |
| Tax Expense | Σ `debit` en accounts `subtype='tax'` | expense accounts | amount |
| Net Income | `EBIT - Interest - Tax` | derivado | amount |
| Net Margin | `NetIncome/Revenue` | derivado | ratio decimal o `null` |
| EBITDA | `EBIT + D&A` | derivado | amount |
| Revenue Growth | `pctChange(prevRevenue, currRevenue)` — null si `prev=0` | revenue histórico | decimal o `null` |
| Margin Delta PP | `(netMargin_curr - netMargin_prev)` — calculado en puntos porcentuales | netMargin por período | decimal en pp o `null` |

### 7.2 Balance Sheet (posicional, al cierre del período)

| Métrica | Fórmula V3 | Fuente de datos | Formato |
|---|---|---|---|
| Current Assets | Σ saldo de accounts `type='asset'` y `current=true` (cash, AR, inventory, predecibles) | asset accounts | amount |
| Non-Current Assets | Σ saldo `type='asset'` y `current=false` | asset accounts | amount |
| Total Assets | Σ saldo `type='asset'` | asset accounts | amount |
| Current Liabilities | Σ saldo `type='liability'` y `current=true` (AP, short-term debt, accrued) | liability accounts | amount |
| Long-Term Debt | Σ saldo `type='liability'` y `current=false` | liability accounts | amount |
| Equity | Σ saldo `type='equity'` (capital + retained + OCI) | equity accounts | amount |
| Total Liabilities + Equity | `currentLiab + longTermDebt + equity` | derivado | amount (debe == totalAssets: invariant check) |
| Current Ratio | `CurrentAssets / CurrentLiabilities` | derivado | ratio o `null` si CL=0 |
| Quick Ratio | `(CurrentAssets - Inventory) / CurrentLiabilities` | derivado | ratio o `null` |
| Working Capital | `CurrentAssets - CurrentLiabilities` | derivado | amount |
| Debt-to-Equity | `(CurrentLiab + LongTermDebt) / Equity` | derivado | ratio o `null` si equity=0 |

### 7.3 Cash Flow Statement (derivado del ledger por categoría)

| Métrica | Fórmula V3 | Fuente | Formato |
|---|---|---|---|
| CFO (operating) | NetIncome + D&A + ΔWC (no-cash working) | derivado | amount |
| CFI (investing) | Σ `debit/credit` en accounts `type='asset'` y `cf_category='investing'` (capex, equity method) | asset accounts + flag | amount |
| Capex (dentro CFI) | Σ `debit` en accounts `is_capex=true` | flag | amount |
| CFF (financing) | Σ `debit/credit` en accounts `cf_category='financing'` (debt drawdown, repay, dividends, equity issuance) | flag | amount |
| Net Change in Cash | `CFO + CFI + CFF` | derivado | amount |
| Ending Cash | `BeginningCash + NetChangeInCash` | asset account cash | amount |

### 7.4 Ratios de gestión de caja y riesgo

| Métrica | Fórmula V3 | Fuente | Formato |
|---|---|---|---|
| Gross Burn | Σ cash outflows del período (CFO + CFI outflows negativos) | cash flow | amount/mes |
| Net Burn | `grossBurn - cashInflows`; >0 quema caja | cash flow | amount/mes |
| Runway (meses) | `endingCash / netBurn` si `netBurn > 0`; `null` si no aplicable | derivado | meses (1 decimal) |
| DSO | `(AR / Revenue) × 360` (o 365) | balance + income | días |
| DPO | `(AP / COGS) × 360` | balance + income | días o `null` si COGS null |
| DSCR | `EBITDA / (Interest + principal due)` | income + debt schedule | ratio o `null` |
| Cash conversion cycle | `DSO + DIO - DPO` | derivado | días o `null` |

### 7.5 Forecasting — intervalos de predicción correctos
```
n = sample size; meanX = (n-1)/2; Sxx = n*(n^2 - 1)/12; dof = n - 2
t_quantile = t_{alpha/2, dof}            // p.ej. via simple-statistics, NO z=1.96
band_i = sigma * t_quantile * sqrt(1 + 1/n + (x_i - meanX)^2 / Sxx)
where x_i = i (índice del punto forecast), i = n, n+1, ..., n+horizon-1
```
Para n=12, dof=10, t_{0.025,10} aprox 2.228 (vs 1.96 de V2 -> 14% más ancho); Sxx=143 (vs n=12 de V2 -> 11.9x más ancho); distancia a meanX (no al último punto) -> factor correcto. Banda total V3 aprox 3.5x más ancha que V2 (corrige la banda artificialmente estrecha).

### 7.6 Backtest — métricas requeridas
```
MAE  = mean(|y_true - y_pred|)
RMSE = sqrt(mean((y_true - y_pred)^2))
MAPE = mean(|y_true - y_pred| / max(|y_true|, eps)) * 100   // %, ignora y_true~0
WAPE = sum(|y_true - y_pred|) / sum(|y_true|) * 100          // %, robusto a escala
Bias = mean(y_pred - y_true)                                 // signo del sesgo
Coverage = % de puntos y_true dentro de [pred - band, pred + band]   // 95% esperado si banda bien calibrada
```
El frontend muestra estas métricas junto al forecast; `Coverage` fuera de [85%, 99%] dispara `alert(type='band_miscalibrated')`.

### 7.7 Stress test (correcciones del audit)
- Divisor mensual->semanal: `52/12` aprox 4.345 (no /4 -> corrige ~8% de sesgo).
- Collection delay: reemplazar step function por cobro distribuido basado en `DSO` (curva exponencial acumulada `1 - e^(-w/DSO_weeks)`).
- Separación obligatoria CFO/CFI/CFF en cualquier stress run.

---

## 8. Decision Engine vs AI Agent — reglas y evidencia

### 8.1 Decision Engine (determinístico, en domain)
Recibe `FinancialSnapshot` + `AnomalyReport` + `RiskReport` + `Forecast` y produce `Decision[]`. **Reglas sin causalidad**:

| Condición | Capability propuesta | rationale |
|---|---|---|
| `runwayMonths < 6` y `netBurn > 0` | `CASH_SWEEP` | "Runway < 6 meses; revisar gastos discrecionales." |
| `netMargin < 0` por 2 períodos+ | `ADJUST_FORECAST` | "Net margin negativo sostenido; revisar forecast y costos." |
| `currentRatio < 1.0` | `TIGHTEN_WORKING_CAPITAL` | "Liquidez corriente insuficiente." |
| `debtToEquity > 2.0` y `dscr < 1.2` | `REVIEW_CAPITAL_STRUCTURE` | "Apalancamiento alto con baja cobertura de deuda." |
| `revenueGrowth < -0.1` | `INVESTIGATE_REVENUE_DECLINE` | "Caída de ingresos > 10%; hipótesis a investigar: pipeline, churn, pricing, vendor, mix, macro." (NO asume causalidad) |
| `covenant.status='breach'` | `NOTIFY_COVENANT_BREACH` | "Breach de covenant `<name>`: valor X vs threshold Y." |
| `|anomaly.z| >= 3` | `INVESTIGATE_ANOMALY` | "Anomalía en `<metric>`: valor X, z=Z; hipótesis enumeradas por el agente." |

Reglas sin payload -> no se emiten. Toda `Decision` incluye `evidence[]` extraída automáticamente del snapshot (ver §8.3).

### 8.2 AI Financial Agent (interpretativo)
- **Qué hace el LLM**: recibe `Decision[]` pre-empaquetado con `evidence[]` y produce `Recommendation{ texto en lenguaje natural, hipótesis[], prioridad, likelihood (cualitativo), risk_amplification }`. El LLM **no** calcula números; sólo reformula, contextualiza y prioriza.
- **Qué NO hace**: inventar coeficientes, inferir causalidad sin evidencia, sobrepasar el whitelist `capabilities`.
- **Prompt contract** (resumen): `"You are a financial analyst. For each decision, generate a recommendation in plain language. Cite each number using evidence[N]. DO NOT invent metrics. DO NOT propose actions outside the capability enum. Hypotheses must list 2-4 possibilities, not select one."`
- **Guardrails**: `capabilities` whitelist por org (fail-closed), rate-limit 10 analyze/hr/user, costo límite USD 0.50/request, kill-switch `org.ai.enabled=false`.

### 8.3 Formato de `evidence[]` trazable
```ts
type Evidence = {
  source: "snapshot.incomeStatement.grossProfit" | "snapshot.balanceSheet.currentRatio"
         | "riskReport.covenants[0]" | "anomalyReport.items[2]"
         | "forecast.backtest.coverage" | "assumptions.revenueShock";
  ref: string;              // p.ej. "snapshot.v1#incomeStatement.grossProfit"
  value: number | string;
  asOf: string;             // ISO timestamp del dato
  formula?: string;         // p.ej. "Revenue - COGS"
};
```

### 8.4 Formato de `Recommendation` (contract binding)
```ts
type Recommendation = {
  id: string;
  organizationId: string;
  capability: CapabilityEnum;     // en whitelist
  title: string;                  // humano
  summary: string;                // lenguaje natural (LLM)
  hypotheses?: string[];          // posibles interpretaciones (no causalidad)
  evidence: Evidence[];           // obligatorio, >=1
  risk: "low" | "medium" | "high";
  confidence: "low" | "medium" | "high";   // basado en coverage, n, variance de evidence
  requiresHumanApproval: true;    // siempre true
  status: "pending" | "approved" | "rejected" | "executed";
  cost?: { usd: number; model: string };   // del LLM
  createdAt: string;
};
```
**Validación de trazabilidad**: una `Recommendation` sin `evidence.length >= 1` y sin `requiresHumanApproval === true` se rechaza en backend con 422.

### 8.5 Prohibiciones explícitas (auditoría V2)
- **`FLAG_VENDOR` eliminado** — reemplazado por `INVESTIGATE_REVENUE_DECLINE` que enumera hipótesis neutrales; el LLM no selecciona una causalidad.
- **Fail-open eliminado** — `capabilities.length === 0` -> 0 acciones.
- **Claims "AI-powered" sólo si `org.ai.enabled=true` y backend usa un modelo real** — si no, label "rules-based decision proposer".

---

## 9. Roadmap de implementación — 6 fases

### Convención
Cada fase define: **objetivo - tareas - archivos afectados - qué se conserva/elimina de V2 - criterios de aceptación medibles**. **No se puede avanzar de fase sin green de la suite de tests de la fase previa** (R8 del spec `architecture`).

---

### FASE 0 — Corrección del motor financiero actual (servicios puros)
> **Sin backend, sin DB.** El objetivo es que el código actual del navegador produzca números correctos en el estado V2 (datos hardcoded de Acme). Bloquea P1.

**Objetivos**
- F0.1 Reescribir `KPICalculator.js` con fórmulas V3 (§7.1).
- F0.2 Ampliar `datasets.js` con campos `cogs, opex, daa, interest, tax, ar, inventory, ap, shortDebt, longDebt, equity` por mes (mantener "Acme" como caso de demo).
- F0.3 Corregir `ForecastingService.js`: intervalo `t_{alpha/2,n-2}`, `Sxx`, distancia a `meanX`; usar `simple-statistics` para cuantil-t.
- F0.4 Corregir `expectedGrowth` para usar `last[metric]`.
- F0.5 Corregir `BenchmarkService.compare`: alinear `operatingMargin<->operatingMargin` y exponer 9/9 métricas (null si no disponibles).
- F0.6 Corregir `CovenantService.evaluate(period, covenants, kpis)` — pasar kpis y propagar en `resolveMetric`.
- F0.7 `MathUtils.pctChange` devuelve `null` (no `0`) si `prev=0` o no finito; documentar contrato.
- F0.8 `MetricCard.jsx` línea 51 -> `Math.abs(delta * 100).toFixed(1)`.
- F0.9 `AgentOrchestrator` fail-closed (capabilities vacío -> 0 acciones) y reemplazar `FLAG_VENDOR` por `INVESTIGATE_REVENUE_DECLINE` con `evidence[]` y `hypotheses[]`.
- F0.10 Suite Vitest: una bateria de tests por fórmula con fixtures; incluir test del intervalo de predicción (n=12 -> banda V3 >= 3x banda V2 corrompida); test backtest métricas; test covenant con kpis; test Gross Profit null si COGS null; test CurrentRatio null si CurrentLiabilities=0.

**Archivos afectados**
- REWRITE: `src/services/financial/KPICalculator.js`, `src/services/financial/ForecastingService.js`, `src/services/financial/BenchmarkService.js`, `src/services/financial/CovenantService.js`, `src/services/core/MathUtils.js` (pctChange), `src/services/agent/AgentOrchestrator.js`, `src/data/datasets.js`.
- EXTEND: `src/components/charts/MetricCard.jsx` (línea 51).
- NEW: `tests/unit/KPICalculator.spec.js`, `tests/unit/ForecastingService.spec.js`, `tests/unit/BenchmarkService.spec.js`, `tests/unit/CovenantService.spec.js`, `tests/unit/MathUtils.spec.js`, `tests/unit/AnomalyService.spec.js`, `tests/unit/CashFlowService.spec.js`, `tests/fixtures/series.js`.
- NEW deps: `vitest`, `@testing-library/react`, `simple-statistics`, `eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`.

**Conserva / Elimina (de V2)**
- Conserva: estructura de carpetas `services/{core,financial,agent,notifications}`, JSDoc, hook `useAgentManager` (sigue siendo real pero sin cablear), EventBus, NotificationService implementation.
- Elimina: `grossProfit = revenue*0.7`, `marginDelta=pctChange(x,x)`, `currentRatio=cash/expenses`, `operatingMargin<-netMargin`, `FLAG_VENDOR`, fail-open capabilities, `sigma*1.96*sqrt(1+1/n+((idx-(n-1))^2)/n)`.

**Criterios de aceptación (medibles)**
1. `npm run test` pasa 100% de la suite F0 (>40 tests, cobertura >= 85% en `src/services/financial/`).
2. Fixture con 12 meses Acme actualizado produce `grossMargin === null` si `cogs` null y `0.52` cuando `cogs` se setea a 38% revenue.
3. `marginDeltaPP` es `(netMargin_curr - netMargin_prev)*100` y != 0 siempre (excepto cuando ambos margenes iguales).
4. `ForecastingService.forecast` con n=12 produce `lower/upper` con factor >= 3.0x respecto a la implementación V2 (test de regresión que retiene un valor V2 y garantiza el widening).
5. `CovenantService.evaluate` con `kpis` pasado: c2/c3/c4 resuelven a número finito o null (no undefined), y `status='passed'` cuando el dato cumple el umbral.
6. `MetricCard` renderizando `delta=0.072` muestra "7.2%" (no "0.1%").
7. `AgentOrchestrator.propose(serie)` con capabilities vacío -> `actions.length === 0`.
8. `AgentOrchestrator.propose` con anomalía negativa -> `capability==='INVESTIGATE_REVENUE_DECLINE'` y `evidence.length >= 1` y `hypotheses.length >= 2`.
9. `npm run lint` pasa sin warnings.
10. `npm audit fix` deja 0 vulns runtime (react-router parchado).

---

### FASE 1 — Data platform local (offline-first)
> **Sin backend.** El usuario puede importar CSV/JSON, persistir localmente, ver datos reales en lugar de Acme y definir Settings persistentes.

**Objetivos**
- F1.1 Repositorio local `IndexedDB` (vía `idb-keyval` o wrapper `local-repository.js`) guardando `series[]`, `covenants[]`, `benchmarks`, `profile`, `notificationChannels`, `agentApprovals`.
- F1.2 Importer CSV/JSON con etapas Ingestion -> Mapping (auto-detect columns) -> Validation (DataValidator extendido con reglas de consistencia: cash no negativo, deltas máximos, fecha continua) -> Preview -> Confirm -> Persist.
- F1.3 Página nueva `Imports.jsx` con wizard (drop file -> mapping -> preview tabla -> confirmar).
- F1.4 Settings funcional: `Save profile` persiste (local-store), `Edit capabilities` modal con checkboxes que MUTA el whitelist del agente (persistido), `Manage integrations` lista conectores con estado "Not connected -> Coming soon" (no badge decorativo falso).
- F1.5 `Export` funcional: descarga JSON/CSV del snapshot actual.
- F1.6 `ErrorBoundary` + ruta 404 + `aria-label` en switch de Settings.
- F1.7 Estado reactivo: provider `OrgContext` / `DataContext` montado en `App.jsx` que reemplaza `MONTHLY_FINANCIALS` hardcoded por series del repo local (fallback Acme si vacío, con banner "demo data").

**Archivos afectados**
- NEW: `src/infrastructure/local/IndexedDbRepository.js`, `src/application/useLocalRepository.js`, `src/application/DataContext.jsx`, `src/application/OrgContext.jsx`, `src/pages/Imports.jsx`, `src/components/imports/ImportWizard.jsx`, `src/components/imports/MappingStep.jsx`, `src/components/imports/ValidationStep.jsx`, `src/components/imports/PreviewStep.jsx`.
- EXTEND: `src/pages/Settings.jsx`, `src/pages/Dashboard.jsx`, `src/pages/Analysis.jsx`, `src/pages/Forecast.jsx` (sustituyen `MONTHLY_FINANCIALS` por `useData().series`), `src/App.jsx` (ErrorBoundary, NotFound, ruta /imports), `src/services/core/DataValidator.js` (reglas consistencia), `src/components/charts/MetricCard.jsx` (null -> "N/A").
- NEW deps: `idb-keyval`, `papaparse`, `react-error-boundary`.

**Conserva / Elimina**
- Conserva: UI / design system / todas las páginas (se adaptan para leer de context).
- Elimina: dependencia directa de `data/datasets.js` en pages (`MONTHLY_FINANCIALS` se consume vía context; `datasets.js` queda como seed para demo inicial).

**Criterios de aceptación**
1. Usuario importa CSV 12 columnas (incluye `cogs, opex, ar, ap, shortDebt, longDebt, equity`) -> wizard muestra errors por fila inválida -> corrige -> confirm -> persiste IndexedDB -> recarga la página conserva datos.
2. Settings -> Save profile persiste nombre/industry/currency y sobrevive recarga.
3. Settings -> Edit capabilities cambia whitelist; agente en Dashboard propone sólo los capabilities activos.
4. `Export` produce un JSON descargable con `FinancialSnapshot.v1` shape (en la versión local, sin `engine.commitHash`).
5. Settings sin badges falsos: "2FA" muestra "Not enabled"; integraciones "Not connected — Coming soon".
6. `ErrorBoundary` captura un throw forzado en un child y muestra fallback.
7. `/no-existe` renderiza `NotFound` con CTA a `/dashboard`.
8. `aria-label` presente en switch del Settings (axe-core pasa).

---

### FASE 2 — Backend + PostgreSQL + Auth + Multi-tenancy + API v1
> **Migración a SaaS real.** Mantiene UI V3-F1 como cliente del API.

**Objetivos**
- F2.1 Esqueleto monorepo (ver §11): `apps/web/` (frontend existente), `apps/api/` (Fastify), `packages/domain/` (engine pura compartido FE/BE), `packages/shared/` (zod schemas), `infra/db/` (Prisma + migraciones). ADR-0001 monorepo vs polyrepo.
- F2.2 Backend Fastify con `/api/v1/*` (todos endpoints §5), hook auth (OIDC JWT verify con `jose`), hook OrgScope (set `app.org_id`), hook RBAC, zod validation request/response, pino logs, OpenTelemetry.
- F2.3 Prisma schema con 19 tablas + RLS policies + triggers `app.org_id`. Migraciones reproducibles.
- F2.4 Auth con Auth0/Clerk/Supabase (OIDC); frontend login flow; route guards.
- F2.5 Multi-tenancy: `/me/orgs` switcher, `X-Organization-Id` en axios/fetch wrapper, `audit_log` write en cada mutación sensible.
- F2.6 Sustituir `local repository` por `API client` con uso de `react-query` (staleness 1m). IndexedDb queda para offline de perfil pero no para datos financieros.
- F2.7 Ingestion backend: `imports` endpoint real con S3/Supabase Storage, Papaparse en servidor, dry-run JSONB en `imports.preview`.
- F2.8 `FinancialSnapshot.v1` computado en backend desde ledger -> Materialized view `financial_snapshots` invalidada por triggers.
- F2.9 CI: GitHub Actions `ci.yml` (install->lint->test->build), `security.yml` (npm audit + SAST), `release.yml` (tag -> deploy).
- F2.10 Deploy: frontend Vercel (preview por PR, prod por tag), backend Railway/Fly.io con migración automática por release.

**Archivos afectados**
- NEW monorepo: `apps/web/**` (mover `src/` actual), `apps/api/src/**` (controllers, hooks, plugins, error handler), `prisma/schema.prisma` (o en `apps/api/prisma/schema.prisma`), `packages/domain/**/*.js` (mueve y bindea el financial engine), `packages/shared/schemas/**` (zod), `.github/workflows/{ci,security,release}.yml`, `infra/db/schema.sql`, `infra/vercel.json`, `infra/railway.json`.
- REWRITE (en `apps/web`): `src/data/datasets.js` (se reduce a fallback demo), todas las pages leen del API client.
- EXTEND: `package.json` raíz (workspaces), `vite.config.js` (alias `@finflow/domain`), `vercel.json` (security headers, ver §11).

**Conserva / Elimina**
- Conserva: design system, estructura de carpetas `services` ahora reubicada en `packages/domain`, el 100% de F0 engine.
- Elimina: dependencia de IndexedDB para datos financieros (queda restringida a preferencias UI); `datasets.js` cesa de ser fuente de verdad.

**Criterios de aceptación**
1. `curl POST /api/v1/auth/login` con idToken de Auth0 retorna JWT válido 201; `GET /api/v1/me` sin Authorization -> 401.
2. `POST /api/v1/organizations/:id/transactions` sin `X-Organization-Id` válido -> 403; con membership de otra org -> 403 (RLS test: insert con otra org_id -> SELECT no la ve).
3. `POST /api/v1/organizations/:id/imports` con CSV 100 filas (5 inválidas) -> status `preview`, `validation.length===5`; `confirm` persiste 95, descarta 5.
4. `GET /api/v1/organizations/:id/snapshots?periodId=X` retorna JSON conforme a zod schema `FinancialSnapshot.v1`; si el periodo no existe -> 404; si `cogs` null en ledger -> `incomeStatement.grossProfit === null`.
5. RLS verificado con test de penetración: usuario A de org 1 no puede SELECT (vía API) registros de org 2.
6. CI: PR roto (test rojo o lint) bloquea merge.
7. `audit_log` registra cada `POST|PATCH|DELETE` con `userId, action, payload, created_at` y es inmutable (test DELETE -> 405).
8. Deploy exitoso: preview en `vercel.app` y `railway.app` para cada PR.
9. `npm audit` sin CVEs runtime en `apps/web` ni `apps/api`.

---

### FASE 3 — Scenario + Risk + Forecasting avanzado + Financial Statements
> Profundización del motor financiero (P2 del audit).

**Objetivos**
- F3.1 Scenario Engine: endpoints `/scenarios` con `assumptions` deltas y snapshot comparado contra baseline; reusa Deterministic Engine sobre ledger transformado (no snapshots agregados).
- F3.2 Risk Engine: `covenants/evaluate` sobre `FinancialSnapshot` derivado; `runway` modelos determinísticos + sensitivity; LAR (liquidity at risk) con simulación Monte Carlo básica (1000 iteraciones, runtime < 1s).
- F3.3 Forecasting avanzado: estrategias `linear`, `Holt-Winters`, `ARIMA(1,1,1)`; `backtest` con MAE/RMSE/MAPE/WAPE/Bias/Coverage; selección automática por AIC y Coverage óptima (`Coverage en [0.9, 0.99]`).
- F3.4 Anomaly avanzado: IQR + STL + ESD iterativo + FDR Benjamini-Hochberg; thresholds por industria en tabla `industry_thresholds` (no hardcoded).
- F3.5 Financial Statement Engine: reportes de Income / Balance / Cash Flow (CFO/CFI/CFF) por período y consolidado, reconciliation `totalAssets === totalLiabilities+Equity`.
- F3.6 StressTest corregido: divisor `52/12`, collection delay DSO-based con curva `1 - e^(-w/DSO_weeks)`, separación CFO/CFI/CFF. Se cablea a Forecast.jsx (deja de ser orphan).
- F3.7 Páginas nuevas: `Scenarios.jsx`, `Risk.jsx` (covenants dashboard histórico), `Reports.jsx` (statements).

**Archivos afectados**
- NEW: `packages/domain/scenario/ScenarioEngine.js`, `packages/domain/risk/RiskEngine.js`, `packages/domain/risk/LiquidityAtRisk.js`, `packages/domain/forecast/Strategies/{Linear,HoltWinters,Arima}.js`, `packages/domain/forecast/Backtest.js`, `packages/domain/forecast/ModelSelector.js`, `packages/domain/anomaly/{IQR,STL,ESD,BH}.js`, `packages/domain/statements/{Income,Balance,CashFlow}Statement.js`, `packages/domain/statements/Reconciliation.js`.
- EXTEND: `apps/api/src/controllers/scenarios.js`, `risk.js`, `forecasts.js`, `forecasts.backtest.js`.
- NEW FE: `apps/web/src/pages/Scenarios.jsx`, `Risk.jsx`, `Reports.jsx`, `src/components/scenarios/ScenarioEditor.jsx`, `src/components/forecast/ModelPanel.jsx` (muestra backtest), `src/components/forecast/BacktestChart.jsx`.
- REWRITE: `src/services/financial/CashFlowService.js` (divisor, collection delay, CFO/CFI/CFF) -> mover a `packages/domain`.

**Conserva / Elimina**
- Conserva: ForecastingService OLS corregido (F0) como `Linear` strategy; AnomalyService 3-sigma como fallback cuando STL no converge.
- Elimina: MoM z=+/-3.5 hardcoded (reemplazado por thresholdsIndustry); `/4` en stressTest.

**Criterios de aceptación**
1. `/scenarios` con `revenueShock=-0.2` produce adjusted snapshot con `revenue` 20% menor y todas las métricas downstream correctas; dif visual side-by-side.
2. `/covenants/evaluate` sobre snapshot con `currentRatio=1.2` y threshold `>=1.5` -> `status='breach'`, `severity='warning'`, `alert` creada.
3. `/forecasts` con `strategy='auto'` sobre serie de 24 meses reporta `modelUsed` y `backtest.coverage en [0.9, 0.99]`. Si Coverage fuera de rango -> `alert(type='band_miscalibrated')`.
4. `Reports.jsx` muestra Income/Balance/CashFlow con `reconciliation ok` (invariante).
5. `stressTest` con `DSO=45` produce cobro semanal con curva exponencial acumulada y `weeklyRevenue = monthlyRevenue * 12/52` (no `/4`).
6. Anomaly con STL detecta estacionalidad (serie con pico anual recurrente) no marca anomalía en el pico estacional; 3-sigma simple V2 sí lo haría (test comparativo).
7. Cobertura de tests >= 90% en `packages/domain`. 50+ tests nuevos.

---

### FASE 4 — AI Agent + trazabilidad + human approval + audit log
> El agente deja de ser reglas if/else y pasa a ser interpretación LLM con guardrails y aprobación humana persistente.

**Objetivos**
- F4.1 Backend `ai/analyze`: recibe `{snapshotId, focus}` -> consulta `FinancialSnapshot` + `AnomalyReport` + `RiskReport` + `Forecast` + `Decisions` (computados por el Deterministic Engine, NO por el LLM) -> construye prompt con `evidence[]` pre-empaquetada -> call LLM provider (Anthropic/OpenRouter vía proxy backend, claves servidor) -> parsea a `Recommendation[]` validando schema zod.
- F4.2 `Recommendation` persistida en `recommendations` table con `status='pending'`, `requiresHumanApproval=true`, `evidence[]`, `hypotheses[]`, `cost`.
- F4.3 `AgentPanel.jsx` nueva página: lista `pending/approved/rejected/executed`; approve/reject con `comment`; multi-approver para `severity='critical'` (>=2 approvals).
- F4.4 `NotificationService` arrancado en `main.jsx` (tabla `alerts` persistida); emisores covenant/anomaly/agent escriben `alerts` en backend; UI oculta cuando `ai.enabled=false`.
- F4.5 `audit_log` cada step: `agent.propose`, `agent.review`, `agent.approve`, `agent.reject`, `agent.execute` con `userId, orgId, recommendationId, comment`.
- F4.6 Guardrails: whitelist `capabilities` por org (fail-closed), rate-limit 10/hr/user, costo límite USD 0.50/req y USD 20/org/día, kill-switch `org.ai.enabled=false` -> label "rules-based decision proposer" en UI.
- F4.7 SDK LLM en backend; provider abstraido (`LlmProvider` interface con impl Anthropic, OpenRouter). ADR-0007 selección.
- F4.8 Explainability panel: cada recomendación expandible con `evidence[]` linkeable (click -> navega al reporte correspondiente en Reports/Analysis/Forecast).

**Archivos afectados**
- NEW: `apps/api/src/services/llm/{LlmProvider.js, AnthropicProvider.js, OpenRouterProvider.js}`, `apps/api/src/controllers/ai.analyze.js`, `apps/api/src/services/AgentService.js`, `apps/api/src/services/EvidenceBuilder.js`, `packages/shared/schemas/recommendation.v1.js`, `apps/web/src/pages/AgentPanel.jsx`, `apps/web/src/components/agent/RecommendationCard.jsx`, `apps/web/src/components/agent/EvidenceList.jsx`.
- EXTEND: `apps/web/src/services/agent/useAgentManager.js` (cablea al API en vez de local), `src/App.jsx` (ruta `/agent`), `src/components/layout/Sidebar.jsx`, `src/services/notifications/NotificationService.js` (subs. a `alerts` vía WebSocket/SSE).
- REWRITE: `apps/web/src/services/agent/AgentOrchestrator.js` -> queda como `DecisionEngine` puro en `packages/domain` (NO es el agente, es pre-procesador determinístico del agente).

**Conserva / Elimina**
- Conserva: `DecisionEngine` (las reglas V3 de F0) como pre-procesador determinístico del agente.
- Elimina: claims "AI-powered" si no hay LLM real; FLAG_VENDOR (ya en F0).

**Criterios de aceptación**
1. `POST /ai/analyze` con snapshot inválido (sin `engine.formulaVersion`) -> 422.
2. Cada `Recommendation` retornada tiene `evidence.length >= 1`, `requiresHumanApproval === true`, `capability` en whitelist.
3. Recomendación sin `evidence` se rechaza en backend (no se persiste).
4. `approve` con `severity='critical'` requiere 2 approvals distintos -> si 1 sola -> status `awaiting_second_approval`.
5. `audit_log` contiene step `agent.propose` con `recommendationId` antes de `agent.approve`.
6. `org.ai.enabled=false` -> `/ai/analyze` retorna 403 y UI muestra label "rules-based".
7. Costo por request > USD 0.50 -> 422; costo por día/org > USD 20 -> 429.
8. Frontend muestra botón "Explain" en cada `Recommendation` que despliega `EvidenceList` con link al reporte origen.
9. Tests E2E: login -> import -> analyze -> approve -> audit_log tiene los 4 steps.

---

### FASE 5 — Integraciones externas
> Conectores reales para que los datos dejen de ser cargados a mano.

**Objetivos**
- F5.1 Banking APIs: Plaid/GoCardless/MX -> ingest de transacciones y balances; job programado reconcilia con `transactions`.
- F5.2 Accounting connectors: QuickBooks Online, Xero -> sincronización P&L/Balance directo a ledger; mapping por `accounts`.
- F5.3 Payment providers: Stripe (AR aging real), MercadoPago regional.
- F5.4 ERP: NetSuite/SAP/Dynamics via periodic CSV import automático y reconc.
- F5.5 EDGAR/Yahoo Finance: beta sectorial -> `industry_thresholds` y `benchmarks` dinámicos.
- F5.6 Importer robusto: Excel (xlsx), validación extendida (multi-sheet), plantillas descargables, mapeo persistente por org.

**Archivos afectados**
- NEW: `apps/api/src/connectors/{plaid,quickbooks,xero,stripe,netsuite,edgar}.js`, `apps/api/src/services/scheduler.js` (job runner), `apps/web/src/pages/Integrations.jsx` (real, no "Not connected").

**Criterios de aceptación**
1. Conector Plaid OAuth -> sincroniza 30 días de transacciones en `transactions`/`transaction_lines` en ledger doble entrada.
2. QuickBooks connector trae P&L mensual como asientos agregados; reconciliation con balances courrentes.
3. `industry_thresholds` poblado por EDGAR en job diario; benchmark dinámico reemplaza constantes.
4. Excel import (xlsx) -> mismo flujo wizard CSV (preview+confirm).
5. Cron scheduler ejecuta sincronizaciones con backoff y `audit_log`.

---

## 10. Matriz de cambios por archivo (V2 -> V3)

| Archivo actual (V2) | Acción V3 | Descripción del cambio |
|---|---|---|
| `package.json` | REWRITE | Migrar a monorepo root con workspaces; introducir `vitest`, `eslint`, `simple-statistics`, `idb-keyval`, `papaparse`, `@auth0/oidc`, `react-query`, `fastify`, `prisma`, `zod`, `pino`, `@opentelemetry/*`. Añadir scripts `test`, `lint`, `test:e2e`, `db:migrate`, `db:seed`. |
| `vite.config.js` | EXTEND | Alias `@finflow/domain` y `@finflow/shared` al workspace; mantener `manualChunks`; añadir `define` para `VITE_API_URL` solo (no se exponen otras secretas). |
| `vercel.json` | REWRITE | Añadir `headers` con CSP, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy, HSTS; mantener rewrites SPA para frontend. Backend se configura en Railway/Fly. |
| `.env.example` | REWRITE | Eliminar `VITE_ANTHROPIC_KEY`, `VITE_OPENROUTER_KEY`. Frontend sólo `VITE_API_URL`, `VITE_AUTH_ISSUER`, `VITE_AUTH_CLIENTID`, `VITE_ADSENSE_ID`. Anotar backend vars `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `DATABASE_URL`, `REDIS_URL`. |
| `.gitignore` | EXTEND | Añadir `.env*`, `coverage/`, `.eslintcache`, `.vscode/`, `.idea/`, `*.log`, `npm-debug.log*`, `*.tsbuildinfo`, `.cache/`; eliminar duplicado `.vercel`. |
| `public/robots.txt` | REWRITE | `Allow: /` para rutas públicas (landing); `Disallow: /dashboard`, `/analysis`, `/forecast`, `/settings`, `/imports`, `/scenarios`, `/risk`, `/agent`; eliminar referencia `/app`. |
| `public/sitemap.xml` | REWRITE | Sincronizar con rutas reales (`/`, sin rutas privadas). |
| `README.md` | REWRITE | Renombrar claims; "rules-based decision proposer" mientras `ai.enabled=false`; tabla de features REAL/Coming soon; enlace a `docs/adr/index.md`; instrucciones de monorepo y env. |
| `src/App.jsx` | REWRITE (-> `apps/web/src/App.jsx`) | ErrorBoundary envuelve `Routes`; ruta catch-all `*` -> `NotFound`; nueva ruta `/imports`, `/scenarios`, `/risk`, `/reports`, `/agent` con `RouteGuards`; providers (`AuthProvider`, `OrgProvider`, `DataProvider`, `QueryClientProvider`). |
| `src/main.jsx` | EXTEND | Monta `NotificationService.start()` (en F2), reporters Sentry, providers; envuelve con `QueryClientProvider`. |
| `src/data/datasets.js` | DOWNGRADE | Cesa de ser fuente de verdad; queda como seed inicial para demo `Acme Corp`. Eliminar covenants hardcoded (backend los gestiona). |
| `src/services/core/MathUtils.js` | REWRITE (-> `packages/domain/math`) | `pctChange` retorna `null` si `prev=0`/no finito; añadir `studentTQuantile` wrapper (via `simple-statistics`); documentar contrato. |
| `src/services/core/DataValidator.js` | EXTEND | Añadir reglas de consistencia cross-field; detección de deltas irracionales; `validateImport(rows)`. |
| `src/services/core/EventBus.js` | KEEP (mover) | Implementación correcta; se mantiene como utilidad de pub/sub local. En backend se sustituye por cola persistente. |
| `src/services/financial/KPICalculator.js` | REWRITE (-> `packages/domain/engine/KpiCalculator.js`) | Fórmulas V3 §7.1; null propagation; `ratiosFor` se elimina (delegar a Snapshot), se añade `fromLedger(lines, period)`. |
| `src/services/financial/BenchmarkService.js` | REWRITE | Alinear `operatingMargin<->operatingMargin`; exponer 9/9 dimensiones con `null` cuando no aplicable; score penaliza omisión. |
| `src/services/financial/CovenantService.js` | REWRITE | `evaluate(snapshot, covenants)` sobre `FinancialSnapshot` derivado; emite `covenant.breach` a `alerts`. |
| `src/services/financial/ForecastingService.js` | REWRITE (-> `packages/domain/forecast/Strategies/Linear.js`) | Intervalo t-Student correcto, `Sxx`, distancia a `meanX`; `expectedGrowth` con `last[metric]`; `backtest()`. |
| `src/services/financial/AnomalyService.js` | EXTEND (-> `packages/domain/anomaly`) | Mantener 3-sigma como fallback; añadir IQR, STL, ESD, BH en F3. |
| `src/services/financial/CashFlowService.js` | REWRITE | Divisor `52/12`; CFO/CFI/CFF; collection delay DSO-based; eliminar `/4` y step. Cablear `stressTest` a Forecast/Scenarios. |
| `src/services/financial/VarianceService.js` | KEEP (mover) | REAL en V2, mover a `packages/domain/analytics`. Sólo cleanup: usa `null` en vez de 0. |
| `src/services/agent/AgentOrchestrator.js` | RENAME -> `packages/domain/decision/DecisionEngine.js` | Reglas sin causalidad; `evidence[]`; hypotheses[]; fail-closed; `FLAG_VENDOR` eliminado. NO es el agente IA. |
| `src/services/agent/useAgentManager.js` | EXTEND | Cablea al API `/ai/analyze`, `/recommendations`, `/audit-log`. Mantiene `run/approve/reject/clear`. |
| `src/services/notifications/NotificationService.js` | EXTEND | `start()` invocada en `main.jsx`; suscribe a `alerts` via SSE; persiste unread en backend. |
| `src/utils/formatters.js` | EXTEND | Mantener `fmt.percent` (×100); añadir `fmt.nullNA(v)` render "N/A" si null. Alinear con `MetricCard.delta`. |
| `src/components/charts/MetricCard.jsx` | EXTEND | `delta` ahora multiplica por 100 (corregir linea 51); `null` -> "N/A". |
| `src/components/charts/LineChart.jsx`, `BarChart.jsx` | KEEP | Adaptar a series de `react-query`. |
| `src/components/ui/*` (Button, Card, Modal, Input, Tabs, Table, Skeleton, EmptyState, Badge) | KEEP | Design system conservado. |
| `src/components/layout/{Navbar,Sidebar,PageContainer}.jsx` | EXTEND | Navbar: campana notificaciones (NotificationService); Sidebar: nuevas entradas (Imports, Scenarios, Risk, Reports, Agent); PageContainer: `aria-current`. |
| `src/components/landing/*` | KEEP | Landing page sigue siendo estática y pública. |
| `src/pages/Landing.jsx` | KEEP | Sin cambios funcionales; alinear copy con V3 real. |
| `src/pages/Dashboard.jsx` | REWRITE | Lee de `useSnapshot()` (API); `Export` implementado (F1); botón "Analyze" invoca `/ai/analyze` y enruta al `AgentPanel`; integra metricas con `null`->"N/A". |
| `src/pages/Analysis.jsx` | EXTEND | Consume `AnomalyReport` (F3 avanzado) y `BenchmarkReport` (9/9); explica via `evidence[]`. |
| `src/pages/Forecast.jsx` | REWRITE | Consume `/forecasts` con `modelUsed` y `backtest`; cablear `stressTest`; `CovenantService.evaluate` sobre snapshot; `MetricCard.delta` con `expectedGrowth` correcto. |
| `src/pages/Settings.jsx` | REWRITE | `Save profile` persiste; `Edit capabilities` modal funcional; `Manage integrations` lista conectores reales (F5) o "Coming soon"; switch `aria-label`; eliminación de badges 2FA decorativos. |
| `src/styles/*` | KEEP | Design system conservado. |
| `src/hooks/useMediaQuery.js` | KEEP | Sin changes. |

**NEW V3 (no existían en V2)**: `apps/api/**`, `packages/domain/**`, `packages/shared/**`, `prisma/schema.prisma`, `infra/**`, `.github/workflows/**`, `apps/web/src/infrastructure/api/**`, `apps/web/src/pages/{Imports,Scenarios,Risk,Reports,AgentPanel,Integrations,NotFound}.jsx`, `docs/adr/**`.

---

## 11. Riesgos y decisiones abiertas (ADR-style)

### ADR-0001 — Monorepo vs polyrepo
- **Estado**: Propuesto.
- **Contexto**: V2 es SPA único; V3 introduce frontend, backend, shared domain, schemas, db. Decisión entre un monorepo (workspaces npm) o polyrepo.
- **Decisión**: **Monorepo** con `apps/web`, `apps/api`, `packages/domain`, `packages/shared`, `infra`, `prisma`, `.github`, `docs`. Es shared intensivo del domain entre FE y BE (zod schemas, financial engine puro); el coste de coordinación polyrepo es alto.
- **Alternativas consideradas**:
  - Polyrepo (`finflow-web`, `finflow-api`, `finflow-domain` package npm): + independencia de deploy; − version drift del dominio, complejidad de release coordinado.
  - Monorepo git submodules: híbrido, − tooling frágil.
- **Consecuencias**: + atomicidad de cambios cross-stack; − stricter CI para evitar rebuilds lentos (caché con turbo/nx en el futuro).
- **Coste de reversión**: Medio (2 días en split separado; preservando git history).
- **Riesgo mitigado**: drift del contrato zod -> mitigado por shared package; CI corre schemas tests en cada PR.

### ADR-0002 — Fastify vs Express
- **Estado**: Propuesto.
- **Contexto**: Backend Node.js para `/api/v1`. Fastify ofrece esquemas nativos, hooks de request lifecycle, performance ~2× Express, plugins first-class. Express tiene mayor ecosystem pero más boilerplate.
- **Decisión**: **Fastify**. Esquemas zod convierten plugins a JSON schema; hooks `preHandler` son ideales para `auth/org-scope/rbac`; mejor throughput para SaaS multi-tenant; serialización rápida.
- **Alternativas**: Express + middleware custom; NestJS (más overhead, framework opinionado para fases F0-F2).
- **Coste reversión**: Bajo (2-3 días refactor de controllers/integración).
- **Riesgo**: curva de aprendizaje del equipo -> mitigado con docs internos y lint estricto zod.

### ADR-0003 — Prisma vs Drizzle
- **Estado**: Propuesto.
- **Contexto**: ORM para PostgreSQL. Prisma ofrece schema declarativo, migraciones, type-safe; Drizzle ofrece SQL-first más liviano y mejor para RLS avanzada.
- **Decisión**: **Prisma** para el grueso del modelo y migraciones; `prisma.$executeRaw` para queries críticas RLS (donde Prisma no gestiona `SET app.org_id` por sesión, el controller lo hace vía raw en transacción).
- **Alternativas**: Drizzle si el equipo prefiere SQL-first y zero-overhead.
- **Coste reversión**: Alto (refactor de repos y migraciones, ~1 semana) -> exige decisión temprana.
- **Riesgo**: RLS con Prisma requiere `SET LOCAL app.org_id` raw -> mitigado con helper transaccional en un middleware.

### ADR-0004 — Auth: Auth0 vs Clerk vs Supabase Auth vs self-hosted
- **Estado**: Propuesto.
- **Contexto**: Necesidad de OIDC multi-tenant, 2FA TOTP real, RBAC, gestión de organizaciones.
- **Decisión**: **Clerk** (organizations first-class) o **Supabase Auth** (si se quiere unificar con la DB Postgres para reducir coste). Self-hosted sólo si compliance lo requiere.
- **Alternativas**: Auth0 (maduro, caro para escala); NextAuth/Custom (coste operacional alto).
- **Coste reversión**: Bajo (intercambiar proveedor -> ajustar claims mapping).
- **Riesgo**: lock-in -> mitigado con capas de abstracción (`AuthProvider` interface).

### ADR-0005 — Multi-tenancy strategy: DB-per-tenant vs shared schema + RLS
- **Estado**: Propuesto.
- **Contexto**: SaaS multi-tenant. DB-per-tenant aísla totalmente pero es caro; shared schema con RLS es operativo.
- **Decisión**: **Shared schema + RLS estricto** para F0-F3; revisar DB-per-tenant en F4 si aparecen clientes enterprise con compliance hard (FINMA/HIPAA).
- **Alternativas**: DB-per-tenant a partir de 10 enterprise customers; tenant-per-schema (middle ground).
- **Coste reversión**: Alto -> obligatorio definir un `tenantId` en cada tabla desde F0.
- **Riesgo**: RLS mal aplicado -> cross-tenant leak -> mitigado con tests de penetración en cada PR.

### ADR-0006 — AI Agent: estado "rules-based" vs LLM
- **Estado**: Propuesto.
- **Contexto**: V2 llama "AI-powered" a un sistema de reglas. V3 debe ser honesto: el `DecisionEngine` es determinístico; el AI Agent requiere LLM real.
- **Decisión**: Haber `ai.enabled=false` por defecto en F0-F3. En F4 se habilita con `ai.enabled=true` cuando backend invoca LLM real. Label UI cambia con `ai.enabled`.
- **Alternativas**: Inicialmente LLM en F2 (riesgo: claves, costo, alucinación); self-hosted Llama3 (operación costosa).
- **Coste reversión**: Bajo (flag).
- **Riesgo**: Alucinación del LLM -> mitigado con Evidence Builder + zod schema + guardrails coste + kill-switch.

### ADR-0007 — LLM provider selection (Anthropic vs OpenAI vs OpenRouter)
- **Estado**: Diferido (decide en F4).
- **Contexto**: Selección comercial del proveedor de modelos. No es decisión arquitectónica, sólo contractual.
- **Decisión**: Pendiente. Abstracción `LlmProvider` permite swap.
- **Alternativas**: Anthropic Claude (mejor reasoning financiero), OpenAI GPT-4, OpenRouter multi-modelo failover.
- **Coste reversión**: Bajo (interface provider).

### ADR-0008 — Eliminación de FLAG_VENDOR (causalidad inferida)
- **Estado**: Aceptado (F0).
- **Contexto**: V2 salta de "anomalía de ingresos" -> "investigar vendor/pipeline" sin evidencia causal.
- **Decisión**: Reemplazar con `INVESTIGATE_REVENUE_DECLINE` que enumera `hypotheses[]` plurales (pipeline, churn, pricing, vendor, mix, macro) y deja al humano seleccionar. El LLM (F4) puede sugerir prioridades pero no afirma causalidad.
- **Alternativas**: Eliminar capability completo (pérdida de la proactividad).
- **Coste de reversión**: Bajo (rename).
- **Riesgo mitigado**: daño reputacional hacia vendors por flag infundado.

### ADR-0009 — Inmutabilidad del ledger
- **Estado**: Aceptado.
- **Contexto**: Estándar contable exige que el asiento no se modifique post-commit.
- **Decisión**: `transaction_lines` append-only; corrección via transacción de reversa con `reverses_transaction_id`. No `UPDATE`/`DELETE` permitido (RLS + trigger BLOCK).
- **Alternativas**: Soft-delete (no auditable); flag `voided` (expone errores).
- **Coste reversión**: N/A (es requisito funcional).
- **Riesgo**: complejidad para usuarios no contables -> mitigado con UI "reverse entry" guiada.

### ADR-0010 — Reversibilidad de V2 (qué conservar, qué eliminar)
- **Estado**: Aceptado.
- **Decisión**: **Conservar**: design system (Tailwind config, components/ui/*), estructura de carpetas de servicios (reubicada a `packages/domain`), el hook `useAgentManager` (real), `EventBus`, `VarianceService` (real), lazy-loading/Suspense/manualChunks. **Eliminar**: placeholders de fórmula, sistema de reglas if/else etiquetado "AI", fail-open capabilities, `FLAG_VENDOR`, constantes `INDUSTRY_BENCHMARKS` hardcoded, badges decorativos de 2FA/data residency, `VITE_ANTHROPIC_KEY`/`VITE_OPENROUTER_KEY`, `MONTHLY_FINANCIALS` como fuente de verdad.
- **Coste reversión**: Cada eliminación es atómica y testeada. Reintroducir un elimino cuesta 1 día.

### ADR pendientes de F2+
- ADR-0011 Deploy SSE/WebSocket para notificaciones en tiempo real.
- ADR-0012 Estrategia de caché de snapshots (Redis TTL vs row-update trigger).
- ADR-0013 Definición de schedule de background jobs (reconc, sync).
- ADR-0014 Política de retención y GDPR/CCPA (eliminación de datos del tenant).

---

## 12. Criterios de salida de la fase de Arquitectura

Validación contra `specs/03-architecture/architecture.spec.md`:

| Criterion (spec) | Evidencia en este documento |
|---|---|
| R1: Toda decisión material documentada como ADR | §11 ADR-0001..0010 redactados; ADRs pendientes listados (ADR-0011..0014). Directorio `docs/adr/` a crear por el greasehole de implementación. |
| R2: >=1 ADR por hito | F0->ADR-0008/0010; F1->ADR-0010; F2->ADR-0001/0002/0003/0004/0005; F3->ADR-0012; F4->ADR-0006/0007. |
| R3: Límites de contexto explícitos con contrato | §3 tabla de 9 contextos con contrato entrada/salida. |
| R4: Monolito modular por defecto; distribución con ADR | Monolito modular (monorepo apps+packages). Sin distribución en F0-F5 -> no necesita ADR de distribución. |
| R5: Capas por dirección de dependencia | §2 D7 + diagrama §3: `presentation -> application -> domain <- infrastructure`. |
| R6: Trade-offs cuantificables | §11 alternativas con coste en días/semanas, latencia, throughput (~2x Fastify), complejidad operacional. |
| R7: Sin dependencias circulares | §2 D12 + CI `madge` en F2. |
| R8: Fail explícito por defecto | §2 D2 + fórmulas §7 con `null` propagation; fail-closed agent §8. |
| R9: Reversibilidad por diseño | §2 D10 + cada ADR con coste de reversión. |
| R10: ADR autoritativo | Encabezado del documento: "en conflicto este spec > código V2". |

**Criterios de salida de la presente fase de arquitectura**:
1. Este documento `finflow-v3-architecture.spec.md` está mergeado en `main` dentro de `docs/superpowers/specs/`.
2. Existe `docs/adr/` con ADR-0001..ADR-0010 redactados al formato `NNNN-titulo.md` (ver plantilla al final) — tarea del greasehole de implementación de F0.
3. `/me/orgs`, `/snapshots`, `/recommendations`, `/audit-log`, `/ai/analyze`, `/imports` endpoints §5 cubren los 9 contextos §3.
4. zod schema `FinancialSnapshot.v1` definido en `packages/shared/schemas/snapshot.v1.js` idéntico al shape §6.
5. Fórmulas §7 alineadas en código con tests (`tests/unit/KPICalculator.spec.js` y análogos) — gate de F0.
6. `npm run lint` y `npm run test` ejecutables desde el root del monorepo (configura F0).
7. `vercel.json` con `headers` de seguridad (H-SEC-03 cerrado).
8. `npm audit` 0 vulns runtime.
9. `.env.example` saneado (sin `VITE_*` keys de LLM).
10. README actualizado y alineado (claims honestos: "rules-based" hasta F4).

**Plantilla ADR (vinculante en `docs/adr/NNNN-titulo.md`)**:
```markdown
# ADR-NNNN: <título>
- Estado: Propuesto | Aceptado | Deprecado | Reemplazado por ADR-XXXX
- Fecha: YYYY-MM-DD
- Contexto: <por qué decidimos ahora>
- Decisión: <qué decidimos>
- Alternativas consideradas: <2+ con trade-offs medibles>
- Consecuencias: <positivas, negativas, neutralizadas>
- Coste de reversión: <estimación + ruta>
- Módulos afectados: <lista>
- Riesgos: <lista con mitigación>
```

---

## 13. Documentos referenciados (binding chain)

- `docs/audit/analysis-report.md` — auditoría V2 (75 funcionalidades clasificadas; 41 hallazgos `archivo:línea`).
- `specs/03-architecture/architecture.spec.md` — reglas R1-R10 validadas en §12.
- `specs/04-development/repository-structure.spec.md` — estructura monorepo (R2-R12).
- `docs/adr/NNNN-*.md` — ADRs requeridos por R1-R2.
- `packages/shared/schemas/snapshot.v1.js` — contrato zod equivalente a §6.
- `infra/db/schema.sql` y `prisma/schema.prisma` — implementación del modelo §4.

---

Fin del documento. Próximo paso accionable: iniciar **Fase 0** conforme a §9, con criterios de aceptación medibles y suite Vitest en verde como gate para Fase 1.
