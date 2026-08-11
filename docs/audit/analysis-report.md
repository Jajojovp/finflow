# Informe Maestro de Auditoría — FinFlow v2.0.0

**Aplicación:** FinFlow — Financial Intelligence Engine
**Repositorio:** `afde-complete-v2/afde-complete`
**Commit auditado:** `6de0bef` (rama `main`)
**Versión del paquete:** `finflow@2.0.0`
**Stack:** React 18.3.1 · Vite 5.4.21 · React Router 6.30.4 · Recharts 2.15.4 · Tailwind 3.4.19
**Fecha de auditoría:** 2026-08-10
**Auditor:** Ingeniero de Validación y Auditoría (rol)
**Clasificación del documento:** Informe ejecutable de hallazgos — **NO modificar código de la app**; este archivo es documentación.

---

> **Veredicto ejecutivo de cabecera:** FinFlow v2.0.0 es un **prototipo avanzado / demo funcional** de una SPA financiera, **NO apto para producción ni para procesar datos financieros reales**. El frontend está pulido, la arquitectura de servicios está razonablemente organizada y la cobertura funcional_DECLARADA es amplia, pero el **motor financiero contiene errores de fórmula** (gross profit placeholder, current ratio con denominador incorrecto, marginDelta siempre 0), el **forecasting produce intervalos de confianza ~3.5× más estrechos de lo correcto**, el **agente es un sistema de reglas if/else etiquetado como "AI-powered"**, varios servicios críticos son **código muerto (huérfanos)** y **no existe backend, persistencia, autenticación, multi-tenancy, ingesta de datos, tests, CI/CD ni monitoring**. Antes de cualquier uso real debe ejecutarse el plan P0→P1 aquí descrito.

---

## 1. Resumen ejecutivo

### 1.1 Conclusión consolidada

FinFlow se presenta en su `README.md` como un _"AI-powered financial decision engine"_ que unifica motor de KPIs, análisis de flujo de caja, forecasting, detección de anomalías, benchmarking, monitoreo de covenants, agente autónomo y notificaciones inteligentes. La verificación de código demuestra que **la capa de presentación (Landing, Dashboard, Analysis, Forecast, Settings) es real y funcional como demo**, pero por debajo:

- **El motor financiero tiene erroresde fórmula verificables** en al menos 5 cálculos centrales (gross profit, marginDelta, currentRatio, operatingMargin, covenants c2–c4).
- **El forecasting calcula intervalos de predicción incorrectos** (z en vez de t, denominador `n` en vez de `Sxx = n(n²−1)/12`, distancia al último punto en vez de a la media) → bandas artificialmente estrechas que **sobreestiman la confianza y subestiman el riesgo**.
- **El "Autonomous Agent" es un conjunto de reglas if/else deterministas** (no hay LLM, no hay inferencia, no hay `VITE_ANTHROPIC_KEY`/`VITE_OPENROUTER_KEY` referenciado en el código), con un salto causal injustificado (anomalía de ingresos → "flag vendor") y un `capabilities` fail-open por defecto.
- **Notificaciones, agente y stressTest son código muerto**: existen como módulos pero **ningún componente de página los importa/emite/inicia**. La cadena EventBus→NotificationService está rota en ambos extremos (nadie emite `covenant.breach`/`anomaly.detected`, `NotificationService.start()` jamás se invoca).
- **No hay backend, persistencia, autenticación, multi-tenancy ni ingesta**: 0 apariciones de `localStorage`, `sessionStorage`, `fetch(`, `express`, `papaparse`, `axios` o `indexedDB` en `src/`. Los datos son 12 meses hardcoded de "Acme Corp" en `datasets.js` (4 campos por mes).
- **No hay tests** (0 archivos `*.test.*`), **`npm run lint` falla** (`eslint` no está instalado), **sin ErrorBoundary**, **sin ruta 404**, **sin CI/CD**, **sin monitoring**.
- **2 hallazgos críticos de seguridad**: vulnerabilidad runtime en `react-router-dom@6.30.4` (open redirect → vector de phishing/XSS) y patrón inseguro en `.env.example` (`VITE_ANTHROPIC_KEY=sk-ant-...`/`VITE_OPENROUTER_KEY=sk-or-...` — las `VITE_` se exponen al bundle del navegador).

**Recomendación de release gate:** 🔴 **BLOQUEAR**. No aprueba el release para datos reales. Apto únicamente como pieza de portfolio/demo interna tras corregir los hallazgos P0.

### 1.2 Score por área

| # | Área | Score (/10) | Justificación breve |
|---|------|:---:|---|
| 1 | Concepto y propuesta de valor | **8.5** | Visión clara y relevante; narrativa de producto bien articulada en el README. |
| 2 | Arquitectura frontend (UI/presentación) | **7.5** | Lazy loading, Suspense, alias `@`, chunking manual, componentes UI reutilizables. Sin ErrorBoundary ni 404 le resta. |
| 3 | Organización del código | **8** | Capas `core/financial/agent/notifications` separadas, JSDoc en todos los servicios, naming consistente. Capa muerta no penaliza organización. |
| 4 | Motor financiero (KPIs/Covenants/Benchmark) | **5** | Errores de fórmula en gross profit, currentRatio, operatingMargin, marginDelta, covenants c2–c4. No usa COGS/AR/AP/debt/equity. |
| 5 | Forecasting | **5.5** | Tendencia+estacionalidad correcta en concepto; intervalos estadísticamente inválidos (~3.5× estrechos); expectedGrowth roto para metric≠revenue. |
| 6 | Detección de anomalías | **6** | 3-sigma + MoM funcional y determinista; sin IQR, FDR, estacionalidad ni control de falsos positivos; z=±3.5 fijo en MoM. |
| 7 | Agente autónomo | **5.5** | Diseño puro/sin efectos (testable) y hook con aprobación humana bien estructurado; pero NO es IA, es reglas; salto causal FLAG_VENDOR; fail-open; huérfano. |
| 8 | Modelo de datos y producción | **3** | 4 campos/mes hardcoded; sin persistencia, ingesta, backend ni facturación; Acme Corp ficticio. |
| 9 | Seguridad | **5** | Sin headers, patrón `VITE_` para secretos, CVE runtime en react-router, robots.txt permeable, claims 2FA/decorativos. |
| 10 | Escalabilidad SaaS (multi-tenancy) | **3** | Sin auth, sin orgs, sin RBAC, sin aislamiento de datos. No es SaaS; es single-tenant demo. |
| 11 | Production readiness | **4** | Sin ErrorBoundary, 404, tests, lint, CI, monitoring, smoke tests ni gestión de secretos. |
| 12 | Potencial | **9** | Base sólida para convertirse en producto real si se ejecuta la hoja de ruta P0→P4: estructura limpia, dominio bien acotado, claros gaps a cerrar. |
| | **Promedio ponderado (áreas técnicas)** | **5.6** | Sin ponderar; las áreas 4–11 pesan y arrastran el promedio al rango "demo, no producción". |

---

## 2. Metodología y alcance

### 2.1 Alcance

Auditoría integral de la aplicación FinFlow v2.0.0 (commit `6de0bef`, rama `main`), entendida como SPA React/Vite de inteligencia financiera, comprendiendo las 5 páginas (`Landing`, `Dashboard`, `Analysis`, `Forecast`, `Settings`), la capa de servicios (`core/`, `financial/`, `agent/`, `notifications/`), el modelo de datos embebido (`datasets.js`), la configuración de build/deploy (`vite.config.js`, `vercel.json`, `package.json`) y los activos públicos (`robots.txt`, `sitemap.xml`).

### 2.2 Las cuatro auditorías independientes consolidadas

Este informe consolida y **verifica de forma independiente** (leyendo el código fuente, no aceptando a ciegas los diagnósticos) los resultados de cuatro auditorías previas con focos ortogonales:

| # | Auditoría | Foco | Dimensión primaria | Qué cubrió |
|---|-----------|------|--------------------|-----------|
| A1 | Financiera / matemática | Correctitud de fórmulas | Integridad cuantitativa | KPICalculator, BenchmarkService, CovenantService, ForecastingService, AnomalyService, CashFlowService, VarianceService, MathUtils, DataValidator. Verificación de cada fórmula contra definiciones contables/estadísticas estándar. |
| A2 | Funcional / QA | Alcance vs. comportamiento real | Trazabilidad req-by-req | Cada claim del README vs. implementación: ¿existe?, ¿funciona?, ¿está cableado a la UI?, ¿está testado? Clasificación REAL/PARTIAL/MOCK/BROKEN/MISSING. a11y, botones sin onClick, switches, ErrorBoundary, 404. |
| A3 | Seguridad / DevOps | Superficie de ataque, dependencias, deploy | Riesgo y operaciones | `npm audit`, `.env.example`, `vercel.json` headers, `robots.txt`, `.gitignore`, secretos en bundle, CVEs, CI/CD, monitoring. |
| A4 | Modelo de datos | Shape, persistencia, ingesta, multi-tenancy | Datos | `datasets.js` (campos por período), presencia/ausencia de COGS, AR, AP, debt, equity, localStorage/fetch/express/papaparse, aislamiento por tenant, backend. |

### 2.3 Protocolo de verificación cruzada

Cada hallazgo de las cuatro auditorías fue **re-verificado de forma independiente** por el auditor de consolidación siguiendo el principio _"evidence before claims"_: para cada afirmación se (1) localizó el archivo y la línea exacta en el commit auditado, (2) se leyó el código y/o (3) se ejecutó un comando reproducible (npm audit / npm ls / grep / glob), y (4) se trazó hasta el consumo en la UI cuando aplicó. Los hallazgos que no pasaron esta verificación se marcan explícitamente. El anexo §6 documenta el rastro completo de evidencia.

---

## 3. Clasificación maestra de funcionalidad

Leyenda de clasificación:
- **REAL** — Implementado correctamente y cableado a la UI; funcional de extremo a extremo en la demo.
- **PARTIAL** — Existe y se ejecuta, pero con defectos conocidos o limitaciones que afectan corrección/robustez.
- **MOCK** — Existe en el código pero opera sobre datos sintéticos hardcoded o sin lógica real; no procesa datos reales.
- **BROKEN** — Existe pero produce resultados incorrectos, inconsistentes o engañosos.
- **MISSING** — No existe en el código o no está cableado (declarado pero ausente).
- **ORPHAN** — Implementado (y en ocasiones REAL internamente) pero **no importado ni invocado por ninguna página** → efecto cero en el usuario.

| # | Dominio | Función / Elemento declarado | Archivo | Clasificación | Evidencia (línea clave) |
|---|---------|----------------------------|---------|:---:|---|
| 1 | Motor financiero | KPICalculator.fromMonthly (KPI snapshot) | `services/financial/KPICalculator.js:13-50` | **BROKEN** + **MOCK** | Línea 22: `grossProfit = totalRevenue * 0.7` (placeholder 30% COGS). Línea 29: `marginDelta = pctChange(netMargin, netMargin)` → siempre 0. |
| 2 | Motor financiero | Gross Profit (margen bruto) | `KPICalculator.js:22` | **BROKEN** | `revenue*0.7` en vez de `Revenue − COGS`; no hay campo `cogs` en el modelo. |
| 3 | Motor financiero | Gross Margin | `KPICalculator.js:23` | **BROKEN** | Derivado del grossProfit erróneo → `0.7` siempre (constante), sin info real. |
| 4 | Motor financiero | marginDelta (validación de cambio de margen) | `KPICalculator.js:29` | **BROKEN** | `pctChange(x, x)` con el mismo valor a ambos lados → 0; `kpis.marginDelta` siempre 0. |
| 5 | Motor financiero | ratiosFor.currentRatio | `KPICalculator.js:55-58` | **BROKEN** | `cash / max(expenses, 1)`: usa `expenses` como proxy de `currentLiabilities`. Definición correcta: `Current Assets / Current Liabilities`. |
| 6 | Motor financiero | ratiosFor.operatingMargin | `KPICalculator.js:59` | **BROKEN** | `(revenue − expenses) / revenue` es en realidad net margin, no operating margin (que requiere EBIT/operating income). |
| 7 | Motor financiero | ratiosFor.burnRate | `KPICalculator.js:60` | **PARTIAL** | `expenses − revenue` = net burn del período; correcto como net burn pero sin separar gross/net burn ni distinguir opex de capex. |
| 8 | Motor financiero | BenchmarkService.compare | `services/financial/BenchmarkService.js:14-42` | **BROKEN** | Línea 23: `operatingMargin` mapeado a `kpis.netMargin` (manzanas vs. naranjas). Omite `currentRatio`, `debtToEquity`, `CAC`, `LTV` aunque están en `INDUSTRY_BENCHMARKS`. |
| 9 | Motor financiero | BenchmarkService.score | `BenchmarkService.js:45-50` | **PARTIAL** | Score 0-100 dependiente de `compare` roto; no penalizado por omisión de dimensiones. |
| 10 | Motor financiero | CovenantService.evaluate | `services/financial/CovenantService.js:29-63` | **BROKEN** | Línea 32: `resolveMetric(c.metric, period)` — **no pasa `kpis`** (3er argumento). Covenants con `metric ∈ {debtToEquity, currentRatio, revenueGrowth}` resuelven a `undefined` → siempre breach/warning falso. |
| 11 | Motor financiero | Covenant c2 debtToEquity | `datasets.js:38` | **BROKEN** | `metric: 'debtToEquity'` no existe ni en el record ni en kpis; el modelo no tiene `debt` ni `equity`. |
| 12 | Motor financiero | Covenant c3 currentRatio | `datasets.js:39` | **BROKEN** | `metric: 'currentRatio'` no está en el record de período (solo month/revenue/expenses/cash/budget); kpis no se pasa. Siempre `undefined`. |
| 13 | Motor financiero | Covenant c4 revenueGrowth | `datasets.js:40` | **BROKEN** | `metric: 'revenueGrowth'` no está en el record; kpis no se pasa → siempre `undefined` → falso warning. |
| 14 | Motor financiero | Covenant c1 Minimum Cash | `datasets.js:37` | **REAL** | `metric: 'cash'` existe en el record; funciona. Único covenant operacional. |
| 15 | Motor financiero | MathUtils.pctChange | `services/core/MathUtils.js:60-63` | **PARTIAL** | Devuelve `0` si `prev === 0` (enmascara NaN/Infinity/undefined); propagation silenciosa a marginDelta. |
| 16 | Motor financiero | MathUtils.linearTrend / stddev / sum / mean | `MathUtils.js:45-57, 33-35, 7-15` | **REAL** | Implementación correcta de regresión OLS y estadísticos. |
| 17 | Motor financiero | DataValidator.validateRecord / Series | `services/core/DataValidator.js:24-68` | **PARTIAL** | Valida tipos y no-negatividad; **no** valida consistencia (cash vs revenue+expenses, deltas, continuidad lógica). `isContinuous` es un plus. |
| 18 | Motor financiero | VarianceService.monthly/summary | `services/financial/VarianceService.js:12-43` | **REAL** | Variance = revenue − budget, pct = variance/|budget|; correcto y cableado a `Analysis.jsx:26`. |
| 19 | Motor financiero | CashFlowService.monthlyNetFlow / cumulative | `CashFlowService.js:9-15, 18-25` | **REAL** | `revenue − expenses` y acumulado desde cash inicial; correcto, cableado a Dashboard. |
| 20 | Forecasting | ForecastingService.forecast (tendencia+estacionalidad) | `services/financial/ForecastingService.js:22-79` | **PARTIAL** | Tendencia OLS + ratio estacional por mes calendario; conceptos correctos. |
| 21 | Forecasting | ForecastingService band (intervalo de predicción) | `ForecastingService.js:61` | **BROKEN** | `sigma * confidence * sqrt(1 + 1/n + (idx−(n−1))²/n)`: usa `z=1.96` en vez de `t_{α/2,n−2}`; denominador `n` en vez de `Sxx = n(n²−1)/12`; distancia al último punto en vez de a la media `x̄=(n−1)/2`. Para n=12 → banda ~3.5× más estrecha. |
| 22 | Forecasting | ForecastingService.expectedGrowth | `ForecastingService.js:70` | **BROKEN** para metric≠revenue | `pctChange(last.revenue, points[0].value)` ignora `metric`; si se pronostica `expenses`/`cash` compara contra `last.revenue`. |
| 23 | Anomalías | AnomalyService.detect (3-sigma) | `services/financial/AnomalyService.js:23-50` | **PARTIAL** | z contra tendencia con sigma poblacional; flaggeal correctly en datos sintéticos. Sin IQR, sin FDR, sin seasonal-trend decomposition (STL). |
| 24 | Anomalías | AnomalyService MoM (cambios > 25%/< 50%) | `AnomalyService.js:52-68` | **PARTIAL** | z hardcoded ±3.5; thresholds arbitrarios; sin estacionalidad ni control de múltiples comparaciones. |
| 25 | Agente | AgentOrchestrator.propose (acciones) | `services/agent/AgentOrchestrator.js:32-105` | **PARTIAL** | Reglas if/else deterministas; **no es IA** (0 ML/LLM). README lo declara "AI-powered". |
| 26 | Agente | FLAG_VENDOR (flag vendor for review) | `AgentOrchestrator.js:63-71` | **BROKEN** | Salto causal injustificado: anomalía de ingresos → "investigar pipeline o vendor" — correlación sin evidencia. |
| 27 | Agente | capabilities (fail-open por defecto) | `AgentOrchestrator.js:91` | **BROKEN** | `capabilities.length === 0 ? actions.map(a => a.capability) : capabilities` — sin capacidades → todas permitidas. Fail-open. |
| 28 | Agente | useAgentManager (aprobación humana) | `services/agent/useAgentManager.js` | **REAL** + **ORPHAN** | Hook bien implementado (run/approve/reject/clear, human-in-the-loop). **No importado por ninguna página** (grep en `pages/`). |
| 29 | Agente | AgentOrchestrator (cableado UI) | — | **ORPHAN** | Solo referenciado por `useAgentManager`, que a su vez es huérfano. 0 efectos en usuario. |
| 30 | Notificaciones | NotificationService (pub/sub + canales) | `services/notifications/NotificationService.js` | **REAL** + **ORPHAN** | Implementación real (canales, queue, unreadCount, markRead). **`start()` jamás invocada** → nunca se suscribe. |
| 31 | Notificaciones | EventBus.on('covenant.breach' / 'anomaly.detected') | `NotificationService.js:35-40`, `EventBus.js` | **BROKEN** | 0 emisores en `src/` para `covenant.breach` y `anomaly.detected`; únicamente `agent.proposed` se emite (en AgentOrchestrator, también huérfano). Cadena completa muerta. |
| 32 | Notificaciones | Navbar / icono de notificaciones | “Notifications” mencionado | **MISSING** | No existe componente de notificaciones en Sidebar/Navbar que consuma `NotificationService`. Configurado en Settings pero sin UI. |
| 33 | Frontend/UI | MetricCard value (formato currency/percent) | `components/charts/MetricCard.jsx:61-78` | **REAL** | `fmt.percent` hace ×100 correctamente; valores se muestran bien. |
| 34 | Frontend/UI | MetricCard delta | `components/charts/MetricCard.jsx:51` | **BROKEN** | `Math.abs(delta).toFixed(1)` sin ×100; `delta={kpis.revenueGrowth}` (=0.072) renderiza "0.1%" en vez de "7.2%". Inconsistente con `fmt.percent` que sí hace ×100. |
| 35 | Frontend/UI | ErrorBoundary (gestión de errores) | — | **MISSING** | 0 ocurrencias de `ErrorBoundary`/`componentDidCatch` en `src/`. Solo `Suspense` para lazy loading; errores de render → pantalla en blanco. |
| 36 | Frontend/UI | Ruta 404 / catch-all | `App.jsx:24-31` | **MISSING** | Solo 5 rutas declaradas; `/alguna-ruta` renderiza página en blanco (sin `Navigate` ni ruta catch-all). |
| 37 | Frontend/UI | Settings — switch accesible (a11y) | `pages/Settings.jsx:82-96` | **BROKEN** | `role="switch"` y `aria-checked` OK, pero **sin `aria-label` ni nombre accesible** (la etiqueta está en `<div>` hermano). WCAG 2.2 SC 4.1.2 falla. |
| 38 | Frontend/UI | Settings — "Save profile" button | `Settings.jsx:64` | **MOCK** | `<Button>` sin `onClick`; no persiste el perfil (no hay backend). |
| 39 | Frontend/UI | Settings — "Edit capabilities" | `Settings.jsx:113` | **MOCK** | Sin `onClick`; no abre modal ni edita capabilities reales del agente. |
| 40 | Frontend/UI | Settings — "Manage integrations" | `Settings.jsx:132` | **MOCK** | Sin `onClick`; no conecta/ des-conecta ningún connector (no existen). |
| 41 | Frontend/UI | Dashboard — "Export" | `Dashboard.jsx:50` | **MOCK** | Sin `onClick`; no hay lógica de exportar JSON/CSV/PDF. |
| 42 | Frontend/UI | Settings — "2FA Enabled" badge | `Settings.jsx:126` | **MOCK** | `<Badge tone="success">Enabled</Badge>` decorativo; no hay implementación de 2FA. |
| 43 | Frontend/UI | Settings — "Data residency US-East" | `Settings.jsx:130` | **MOCK** | Badge decorativo; no hay configuración de residencia real. |
| 44 | Frontend/UI | Navbar — botones Search / Notifications | (claim) | **MISSING/MOCK** | Sin onClick ni funcionalidad (si existen en Navbar como claims visuales). |
| 45 | Frontend/UI | Lazy loading + Suspense + manualChunks | `App.jsx`, `vite.config.js:17-20` | **REAL** | `React.lazy` por página, `manualChunks` para vendor/charts. |
| 46 | Frontend/UI | Theme dark-first + Tailwind tokens | `styles/global.css` (declarado) | **REAL** | Implementado en `tailwind.config.js`; UI funcional. |
| 47 | Datos | datasets.MONTHLY_FINANCIALS | `data/datasets.js:9-22` | **MOCK** | 12 meses de 2025 de "Acme Corp", 4 campos/mes (month, revenue, expenses, cash, budget). Sustituir por datos reales. |
| 48 | Datos | Shape del modelo de datos | `datasets.js:10-21` | **MOCK** | Sin `cogs`, `ar` (AR aging), `ap`, `debt` (short/long term), `equity`, `inventory`, `opex`, `capex` → impide calcular Gross Profit, Current Ratio, Debt-to-Equity, Operating Margin reales. |
| 49 | Datos | INDUSTRY_BENCHMARKS | `datasets.js:24-34` | **MOCK** | 9 métricas hardcoded; solo 5 se comparan (3 se ignoran silenciosamente: currentRatio, debtToEquity, CAC, LTV). |
| 50 | Datos | COMPANY_PROFILE | `datasets.js:43-49` | **MOCK** | "Acme Corp", "SaaS", "USD". Editable en Settings pero no se persiste (recarga → reset). |
| 51 | Persistencia | localStorage / sessionStorage / indexedDB | — | **MISSING** | 0 ocurrencias en `src/`. No retiene filtros, perfil, aprobaciones ni estado del agente. |
| 52 | Persistencia | Capa de repositorios / API client | — | **MISSING** | No existe. |
| 53 | Ingesta | Carga CSV / Excel / file upload | — | **MISSING** | 0 usos de `papaparse`/`xlsx`/`FileReader`/`<input type="file">`. README sugiere "replace with real data sources" sin entregar mecanismo. |
| 54 | Ingesta | Integración banking APIs / Plaid / QuickBooks / Xero | — | **MISSING** | No existe. Settings declara "Accounting connector: Not connected" pero sin código de conexión. |
| 55 | Ingesta | Llamada remota fetch / axios | — | **MISSING** | 0 ocurrencias en `src/`. La app es 100% client-side estática; `VITE_API_URL` declarado pero no consumido. |
| 56 | Backend | Servidor Express/Fastify/HTTP API | — | **MISSING** | No existe; el proyecto es SPA pura. |
| 57 | Backend | Esquema de base de datos / migraciones | — | **MISSING** | No existe (ni SQL, ni Prisma, ni Drizzle). |
| 58 | Multi-tenancy | Aislamiento por organización / tenant | — | **MISSING** | 0 nociones de `tenantId`/`orgId`. Datos globales y únicos (Acme Corp). |
| 59 | Multi-tenancy | Autenticación / sesiones / RBAC | — | **MISSING** | 0 auth. No hay login, JWT, OAuth, RBAC, ni guards de ruta. |
| 60 | Multi-tenancy | Audit log / trail de acciones | — | **MISSING** | Aprobaciones del agente NO se persisten ni se registran fuera de state efímero de React. |
| 61 | Seguridad | `vercel.json` security headers | `vercel.json` | **MISSING** | Solo `rewrites`. Sin CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS. |
| 62 | Seguridad | Patrón `.env.example` para API keys | `.env.example:3-4` | **BROKEN** | `VITE_ANTHROPIC_KEY=sk-ant-...` y `VITE_OPENROUTER_KEY=sk-or-...`: cualquier `VITE_` se incrusta en el bundle del navegador. Patrón inseguro para secretos de servidor. (Adicionalmente, estas claves no se referencian en `src/`.) |
| 63 | Seguridad | react-router-dom@6.30.4 | `package.json:19` | **BROKEN** (CVE) | GHSA-wrjc-x8rr-h8h6: open redirect via backslash (bypass CVE-2025-68470). GHSA-337j-9hxr-rhxg: Arbitrary Constructor Injection en SSR hydration. Vulnerabilidad runtime (path traversal phishing→XSS vector). |
| 64 | Seguridad | esbuild@0.21.5 / vite@5.4.21 | devDep | **PARTIAL** (tooling) | GHSA-67mh-4wv8-2f99: dev server permite requests cross-origin. Solo afecta build/dev, no producción. |
| 65 | Seguridad | postcss@8.5.15 / nanoid@3.3.15 | devDep | **PARTIAL** (tooling) | Path traversal en sourceMappingURL (GHSA-r28c-9q8g-f849); nanoid loop indefinido (GHSA-28wg-ghj8-5hjv, GHSA-2v37-7h3g-55p8). Solo tooling. |
| 66 | Seguridad | `robots.txt` | `public/robots.txt:18-22` | **PARTIAL** | `Allow: /` deja indexar todo; referencia rutas inexistentes (`/app`) y expone `/app#` como Disallow fragmentario. Permite crawlers de IA (GPTBot/ClaudeBot) _Allow: /_ sin bloquear rutas internas (`/dashboard`, `/analysis`, `/forecast`, `/settings`). |
| 67 | Seguridad | `.gitignore` | `.gitignore` | **PARTIAL** | Duplica `.vercel` (líneas 7 y 10); omite `.env.production`, `.env.*.local`, `coverage/`, `.eslintcache`, `.vscode/`, `.idea/`, `*.tsbuildinfo`, `npm-debug.log*`. Incompleto. |
| 68 | Testing | Tests unitarios / integración | — | **MISSING** | 0 archivos `*.test.*`. Sin runner (`vitest`/`jest`) configurado. Sin `test` script en `package.json`. |
| 69 | Testing | `npm run lint` (ESLint) | `package.json:13` | **BROKEN** | Script declara `eslint src --ext .js,.jsx`, pero `eslint` no está instalado. `npm run lint` → error "eslint no se reconoce como comando". |
| 70 | Testing | Smoke tests / E2E (Playwright/Cypress) | — | **MISSING** | No existe suite ni configuración. |
| 71 | Testing | CI/CD pipeline (GitHub Actions / Vercel CI) | — | **MISSING** | 0 archivos en `.github/`, sin `Dockerfile`, sin `.gitlab-ci.yml`. Sin gate automatizado. |
| 72 | Producción | Monitoring / observabilidad (Sentry, OTel) | — | **MISSING** | Sin reporte de errores ni telemetría en producción. Errores en runtime → pantalla en blanco silenciosa. |
| 73 | Producción | Health check / readiness probe | — | **MISSING** | No aplica a SPA pura, pero sin backend no hay endpoint `/health` orquestable. |
| 74 | Producción | Rate limiting / abuse protection | — | **MISSING** | Sin backend, sin edge function, sin rate limit. |
| 75 | Producción | Documentación de operaciones (runbook / ADR) | — | **PARTIAL** | README claro (producto) pero sin runbook, ADR, ni docs de deploy más allá de `vercel --prod`. |

**Resumen de clasificaciones:** REAL/REAL+ORPHAN: 9 · PARTIAL (con defectos operando): 12 · MOCK (incluye botones decorativos y datos sintéticos): 11 · BROKEN: 14 · MISSING: 25 · ORPHAN (subset): 4 · CVE/BROKEN: 2.

---

## 4. Hallazgos detallados por área

### 4.1 Motor financiero

#### H-FIN-01 — Gross Profit como placeholder 30% (ALTO)
- **Archivo:** `src/services/financial/KPICalculator.js:22`
- **Código:** `const grossProfit = totalRevenue * 0.7; // placeholder COGS 30%`
- **Problema:** El Gross Profit se calcula aplicando un margen del 70% fijo a los ingresos, en lugar de restar el costo de los bienes vendidos (COGS). El comentario admite explícitamente que es un _placeholder_. Como consecuencia, `grossMargin` (línea 23) es la constante `0.7` sin información real; `BenchmarkService.compare` compara esa constante `0.7` contra `INDUSTRY_BENCHMARKS.grossMargin = 0.52` y siempre reporta un _gap_ de `+0.18` (18 pp) — persistente y sin significado.
- **Fórmula correcta:** `Gross Profit = Revenue − COGS`; `Gross Margin = (Revenue − COGS) / Revenue`.
- **Recomendación:** Ampliar el modelo de datos con campo `cogs` por período (ver §4.9) y eliminar el placeholder. Si no se dispone de COGS, declarar `grossProfit`/`grossMargin` como `null` y mostrar "—" en la UI, en vez de inventar un número.

#### H-FIN-02 — marginDelta siempre 0 (ALTO)
- **Archivo:** `src/services/financial/KPICalculator.js:29`
- **Código:** `const marginDelta = MathUtils.pctChange(netMargin || 0, netMargin);`
- **Problema:** El mismo valor `netMargin` se pasa en ambos argumentos de `pctChange`, por lo que el resultado es `0` para cualquier `netMargin` (distinto de 0); y `0` también cuando `netMargin` es 0 (por el guard de `pctChange`). El KPI "Net margin delta" mostrado en `Dashboard.jsx:54` es **siempre 0** y por tanto no transmite señal alguna.
- **Recomendación:** Calcular `marginDelta` entre el `netMargin` del último período y el del período anterior: `pctChange(prevPeriodNetMargin, lastPeriodNetMargin)`, requiriendo `netMargin` por período (no solo agregado). Alternativamente, exponer `netMarginPeriod` en `ratiosFor` y computar el delta en `fromMonthly`.

#### H-FIN-03 — Current Ratio usa `expenses` como pasivo corriente (ALTO)
- **Archivo:** `src/services/financial/KPICalculator.js:55-58`
- **Código:** `currentAssets = record.cash` · `currentLiabilities = Math.max(record.expenses, 1)` · `currentRatio = currentAssets / currentLiabilities`
- **Problema:** El Current Ratio se define como `Current Assets / Current Liabilities`. Aquí `cash` es solo **una parte** de los activos corrientes (faltan cuentas por cobrar, inventario, valores negociables), y `expenses` **no es un pasivo** (es un flujo de gasto). El denominador es conceptualmente incorrecto. El número resultante carece de significado financiero.
- **Fórmula correcta:** `Current Ratio = Current Assets / Current Liabilities` donde `Current Assets = cash + AR + inventory + …` y `Current Liabilities = AP + short-term debt + accrued expenses + …`.
- **Recomendación:** Ampliar el modelo (`currentAssets`, `currentLiabilities`) y usarlos directamente; o declarar `currentRatio` como `null` mientras no existan los componentes.

#### H-FIN-04 — `operatingMargin` es en realidad `netMargin` (MEDIO)
- **Archivo:** `src/services/financial/KPICalculator.js:59`
- **Código:** `operatingMargin: record.revenue ? MathUtils.round((record.revenue - record.expenses) / record.revenue, 4) : 0`
- **Problema:** `(revenue − expenses) / revenue` es la definición de _net margin_ por período, no de _operating margin_. El Operating Margin debería usar `Operating Income = Gross Profit − OpEx − D&A` (sin intereses ni impuestos). El mislabeling se propaga a `BenchmarkService.compare` línea 23, donde `operatingMargin` se compara contra `bench.operatingMargin = 0.22` — comparando manzanas con naranjas.
- **Recomendación:** Renombrar a `netMarginPeriod`, computar correctamente o marcar `null`. Exponer `operatingIncome` cuando el modelo incluya `opex` y `da`.

#### H-FIN-05 — BenchmarkService mapea `operatingMargin` a `netMargin` (ALTO)
- **Archivo:** `src/services/financial/BenchmarkService.js:23`
- **Código:** `{ metric: 'operatingMargin', company: kpis.netMargin, benchmark: bench.operatingMargin, format: 'percent' }`
- **Problema:** Además del mislabeling de H-FIN-04, el benchmark compara deliberadamente el `netMargin` de la empresa con el `operatingMargin` de la industria. El gap resultante es sistemáticamente engañoso (la empresa aparece peor o mejor de lo real). Adicionalmente, `currentRatio`, `debtToEquity`, `customerAcquisitionCost`, `lifetimeValue` presentes en `INDUSTRY_BENCHMARKS` **se omiten** en `defs` (líneas 19-25) y se ignoran silenciosamente.
- **Recomendación:** Alinear métrica y benchmark (ambos operatingMargin o ambos netMargin). Exponer las 9 dimensiones (o marcar `null` las no disponibles) para que el score no penalice/ premie por omisión selectiva.

#### H-FIN-06 — CovenantService no recibe `kpis` → covenants c2/c3/c4 siempre fallan (ALTO)
- **Archivo:** `src/services/financial/CovenantService.js:29-32` y `src/pages/Forecast.jsx:27`
- **Código:** `evaluate(period, covenants)` → `resolveMetric(c.metric, period)` — sin pasar `kpis` (3er arg). `resolveMetric(metric, record, kpis)` (líneas 17-21) solo busca en `record` o `kpis`.
- **Problema:** `COVENANTS` (`datasets.js:36-41`) incluye `metric: 'debtToEquity'` (c2), `'currentRatio'` (c3) y `'revenueGrowth'` (c4). Ninguno existe en el `period` (que tiene `month/revenue/expenses/cash/budget`). Y `kpis` no se pasa. Resultado: `actual = undefined`, `isNumeric = false`, `passed = false` → status siempre `breach` (c2 es `critical`) o `warning` (c3/c4). Solo c1 (`metric: 'cash'`, que sí está en el record) funciona.
  - En `Forecast.jsx:27`, `CovenantService.evaluate(MONTHLY_FINANCIALS[last], COVENANTS)` confirma el patrón: se pasa solo el último record, no los kpis.
- **Impacto:** La sección "Covenant monitoring" en `Forecast.jsx` muestra **warnings/breaches persistentes falsos** para c2/c3/c4 — un dato financieramente grave (un breach de covenant real tiene consecuencias de crédito). Genera fatiga de alertas y socava la confianza en la herramienta.
- **Recomendación:** `CovenantService.evaluate(period, covenants, kpis)` — pasar el snapshot de KPIs como 3er argumento y propagar en `resolveMetric`. Aún así, los KPIs `debtToEquity` y `currentRatio` deben calcularse correctamente (H-FIN-03) antes de evaluarse como covenants.

#### H-FIN-07 — MathUtils.pctChange devuelve 0 cuando `prev === 0` (MEDIO)
- **Archivo:** `src/services/core/MathUtils.js:60-63`
- **Código:** `if (!Number.isFinite(prev) || prev === 0) return 0;`
- **Problema:** Cuando `prev` es 0 (ej. primer período, margen nulo, kpis inicializados), `pctChange` retorna `0` en lugar de `null`/`Infinity`/`NaN`. Esto propaga "sin cambio" donde en realidad hay cambio indeterminado. Es la causa raíz de que `marginDelta` (H-FIN-02) y otros deltas _aparezcan_ normales cuando enmascaran errores. La decisión es defensible como guard anti-division, pero debería devolver un sentinela distinguible.
- **Recomendación:** Devolver `null` (y que el llamador decida mostrar "—" o "N/A") en lugar de `0`, o normalizar a `NaN` saliendo del camino numérico. Documentar el contrato.

#### H-FIN-08 — DataValidator valida tipos pero no consistencia (MEDIO)
- **Archivo:** `src/services/core/DataValidator.js:24-50`
- **Problema:** `validateRecord` verifica `month` string, `revenue`/`expenses`/`cash` números ≥ 0 y `budget` opcional numérico. No valida consistencia cross-field: e.g., `cash` no puede caer por debajo de los flujos, `revenue` de 0 con `cash` creciente, deltas irracionales, ni continuidad temporal (parcialmente cubierta por `isContinuous`). Dado el peso financiero, validar solo tipos es insuficiente.
- **Recomendación:** Añadir reglas de consistencia (rangos plausibles por industria, deltas máximos, cash vs acumulado de net flow) y emitir issues con `isConsistency` type. Documentar el modelo esperado.

### 4.2 Forecasting

#### H-FC-01 — Intervalo de predicción estadísticamente inválido (~3.5× más estrecho) (ALTO)
- **Archivo:** `src/services/financial/ForecastingService.js:61`
- **Código:** `const band = sigma * confidence * Math.sqrt(1 + 1 / data.length + ((idx - (data.length - 1)) ** 2) / data.length);`
- **Problema:** La fórmula del intervalo de predicción para una regresión lineal OLS con x = 0..n−1 es:

  ```
  band = t_{α/2, n-2} · s · √(1 + 1/n + (x₀ − x̄)² / Sxx)
  ```

  donde `Sxx = Σ(xᵢ − x̄)² = n(n² − 1)/12`, `x̄ = (n−1)/2`, y `t_{α/2, n-2}` es el cuantil de la distribución t de Student con n−2 grados de libertad.

  Falla tres componentes en `ForecastingService`:
  1. `confidence = 1.96` es el cuantil `z` normal (no `t`) para n→∞. Para n=12, `t_{0.025, 10} ≈ 2.228`, ~14% más amplio.
  2. El denominador es `data.length` (= `n`), en lugar de `Sxx = n(n²−1)/12`. Para n=12, `Sxx = 143`, mientras que `n = 12` → ratio 11.9×. Como el término entra en `√(1/…)`, el factor de收紧 es `√(n/Sxx) = √(12/143) ≈ 0.29`. El factor de extrapolación termina siendo `1/√11.9 ≈ 0.29`.
  3. `(idx − (n−1))²` mide la distancia al **último punto observado**, no a la media `x̄ = (n−1)/2`. Para el primer pronóstico (idx = n), el numerador debería ser `(n − (n−1)/2)² = ((n+1)/2)²`, que para n=12 es `42.25`, frente al `1² = 1` usado hoy → 42× más pequeño.

  Combinado, la banda es **≈ 3.5× más estrecha** de lo correcto (la cota inferior y superior están artificialmente juntas al valor central). El usuario ve una falsa sensación de alta confianza en el pronóstico.
- **Fórmula correcta (a implementar):**
  ```js
  const n = data.length;
  const Sxx = n * (n*n - 1) / 12;        // para x = 0,1,...,n-1
  const meanX = (n - 1) / 2;
  const dof = n - 2;
  const t = studentTQuantile(1 - alpha/2, dof);  // tabla o lib (ej. simple-statistics)
  const band = sigma * t * Math.sqrt(1 + 1/n + Math.pow(idx - meanX, 2) / Sxx);
  ```
- **Recomendación:** Corregir la fórmula, integrar una lib de cuantiles-t (`simple-statistics`, `distributions`), y validar con backtesting (ver P2: MAE/RMSE/MAPE/WAPE/Bias/Coverage). Documentar que es intervalo de **predicción** (no de confianza de la media).

#### H-FC-02 — `expectedGrowth` ignora `metric` al calcular la base (MEDIO)
- **Archivo:** `src/services/financial/ForecastingService.js:70`
- **Código:** `const expectedGrowth = last.revenue ? MathUtils.pctChange(last.revenue, points[0]?.value || 0) : 0;`
- **Problema:** Si `options.metric = 'expenses'` o `'cash'`, `points[0].value` contiene el pronóstico de esa métrica, pero la base del cambio es `last.revenue` (que necesariamente != `last[metric]`). El `expectedGrowth` reportado es entonces sin sentido para cualquier métrica que no sea revenue. En el caso actual de Forecast.jsx (siempre metric='revenue'), funciona, pero el defecto está latente.
- **Recomendación:** `const base = last[metric];` y fallar a `null` si no es finito.

#### H-FC-03 — Sin backtesting ni métricas de error (MEDIO)
- **Archivo:** `src/services/financial/ForecastingService.js` (ausente)
- **Problema:** No hay procedimiento de validación holdout/forecast-vs-actual. No se reportan MAE, RMSE, MAPE, WAPE, Bias ni Coverage (qué % de puntos cae dentro de la banda). Sin estas métricas es imposible saber si el modelo es razonable y si la corrección de H-FC-01 produce bands correctamente calibradas.
- **Recomendación:** Añadir `ForecastingService.backtest(series, horizon, metric)` que retenga los últimos `horizon` puntos, los pronostique y calcule MAE/RMSE/MAPE/WAPE/Bias/Coverage; exponer en Analysis o en un panel de modelo.

### 4.3 Detección de anomalías

#### H-AN-01 — 3-sigma sin IQR, FDR ni desestacionalización (MEDIO)
- **Archivo:** `src/services/financial/AnomalyService.js:23-50`
- **Problema:** El detector principal usa `|z| ≥ 3` (configurable pero por defecto fijo) contra el valor esperado por la tendencia lineal. Es razonable para una demo, pero presenta limitaciones conocidas:
  - Sin uso de **IQR** (más robusto a outliers que sigma).
  - Sin **FDR (False Discovery Rate)** / corrección de Bonferroni al testear múltiples puntos y múltiples métricas → inflación de falsos positivos.
  - Sin descomposición **estacional** (STL) y por tanto confunde patrones estacionales regulares con anomalías.
- **Impacto:** En series reales, el 3-sigma tiende a marcar fluctuaciones extremas como anomalías y a perder patrones sutiles.
- **Recomendación (P2):** Sustituir o complementar con IQR+seasonal-trend decomposition; aplicar un control de FDR (Benjamini-Hochberg) y considerar ESD (Generalized Extreme Studentized Deviate) para detección iterativa.

#### H-AN-02 — MoM con z=±3.5 fijo y thresholds arbitrarios (MEDIO)
- **Archivo:** `src/services/financial/AnomalyService.js:52-68`
- **Código:** `if (change <= -0.25 || change >= 0.5) { const z = change <= -0.25 ? -3.5 : 3.5; ... }`
- **Problema:** Los thresholds asimétricos (−25% / +50%) son hardcoded y el z asignado es siempre ±3.5 (lo que `severityFor` clasifica como `critical` para `|z|≥4`, `warning` para `|z|≥3`). El score no refleja riesgo real del cambio. No considera la varianza histórica (un cambio del 25% puede ser normal en un negocio estacional).
- **Recomendación:** Hacer los thresholds configurables por perfil de industria, calibrar z sobre `stddev` de los cambios históricos, y separar el severity del z-score.

### 4.4 Cash flow

#### H-CF-01 — `stressTest` divide por 4 en vez de 4.33 (~8% de error) (MEDIO)
- **Archivo:** `src/services/financial/CashFlowService.js:37-38`
- **Código:** `weeklyRevenue = last.revenue / 4; weeklyExpenses = last.expenses / 4;`
- **Problema:** Un mes tiene en promedio 4.345 semanas. Dividir por 4 sobrestima los flujos semanales en ~8.4%, lo que acumula al proyectar 13 semanas y sesga el `endingCash`/`minCash`. Si bien el método es aproximado por construcción, el error es sistemático.
- **Recomendación:** Usar `52/12 ≈ 4.345` como divisor, o partir del flujo mensual y convertir semanas a fracciones de mes. Documentar el supuesto.

#### H-CF-02 — `collectionDelayWeeks` como step function y sin CFO/CFI/CFF (MEDIO)
- **Archivo:** `src/services/financial/CashFlowService.js:31-48`
- **Problema:** (a) `collected = w > Math.round(collectionDelayWeeks) ? weeklyRevenue * (1+revenueShock) : 0` — el cobro pasa de 0 a 100% en una semana (step), sin modelar DSO (Days Sales Outstanding) con desfase gradual. (b) El cash flow se modela solo como `revenue − expenses`, sin separar **CFO** (operaciones), **CFI** (inversión) y **CFF** (financiamiento) — necesarias para reporting contable y análisis de liquidez.
- **Recomendación (P2):** Modelar `CFO`, `CFI`, `CFF` por separado; reemplazar el step por una curva de-collect basada en DSO; añadir AR aging y AP aging al modelo de datos.

#### H-CF-03 — `stressTest` es ORPHAN (BAJO)
- **Archivo:** `src/services/financial/CashFlowService.js:31`
- **Problema:** `grep stressTest` en `src/` solo encuentra la definición; no se invoca en ninguna página. README declara "sensitivity scenarios and liquidity stress tests" pero no hay UI habilitada.
- **Recomendación:** Cablear `stressTest` a la vista Forecast (panel de escenarios) o eliminar el claim del README.

### 4.5 Agente

#### H-AG-01 — "Autonomous Agent" es reglas if/else, no IA (ALTO)
- **Archivo:** `src/services/agent/AgentOrchestrator.js:32-105`
- **Problema:** `propose(ctx)` contiene 5 bloques `if` que disparan acciones por thresholds (runway < 6 meses → cash sweep; netMargin < 0 → adjust forecast; etc.). No hay inferencia, no hay modelo de lenguaje, no hay `VITE_ANTHROPIC_KEY`/`VITE_OPENROUTER_KEY` referenciados en `src/`. El README declara "AI-powered" y "Autonomous Agent", lo que es **engañoso** para un останов del método.
- **Impacto:** Reputacional; además, el sistema de reglas no se beneficia de razonamiento sobre contexto, datos cualitativos ni transfer learning.
- **Recomendación (P3):** Renombrar a "Rules-based action proposer" en la UI/README mientras no sea IA; o implementar un agente LLM con prompts estructurados, contexto inyectado (kpis, anomalies, covenants, forecast) y restricción de salida a las capabilities enumeradas. Documentar modelo, prompt y costo.

#### H-AG-02 — Salto causal FLAG_VENDOR injustificado (MEDIO)
- **Archivo:** `src/services/agent/AgentOrchestrator.js:63-71`
- **Código:** `if (revenueAnomalies.length > 0) { ... CAPABILITIES.FLAG_VENDOR, "${n} revenue anomaly(ies) detected — investigate pipeline or vendor.", ... }`
- **Problema:** Una anomalía de ingresos no implica causalmente un problema de vendor o pipeline; la inferencia salta de un síntoma a una causa sin evidencia. En un agente autónomo que propone acciones esta inferencia puede conducir a investigaciones erróneas y daño reputacional (e.g., "flag a vendor por review" basado en un dato ruidoso).
- **Recomendación:** Cambiar la capacidad a `INVESTIGATE_REVENUE_ANOMALY` (más neutral) y enumerar posibles causas en el rationale; que el humano decida la hipótesis. Si se adopta un LLM, dejar que éste proponga hipótesis con evidencia.

#### H-AG-03 — `capabilities` vacío se traduce en "todas permitidas" (fail-open) (ALTO)
- **Archivo:** `src/services/agent/AgentOrchestrator.js:91`
- **Código:** `const allowed = capabilities.length === 0 ? actions.map((a) => a.capability) : capabilities;`
- **Problema:** Si no se especifican capacities (caso por defecto en `propose({series, covenants})`), se autorizan **todas** las acciones propuestas. Esto es un patrón **fail-open**: ausencia de configuración → máxima permisividad. En `useAgentManager.js:13` el default es `ALL_CAPABILITIES` (todas), así que también refuerza el fail-open.
- **Recomendación:** Invertir el default: si `capabilities` es vacío, retornar 0 acciones (fail-closed). Requerir configuración explícita del admin para habilitar cada capacidad. Registrar la decisión en audit log.

#### H-AG-04 — useAgentManager y AgentOrchestrator son ORPHAN (MEDIO)
- **Archivo:** `src/services/agent/useAgentManager.js`, `src/services/agent/AgentOrchestrator.js`
- **Problema:** `grep useAgentManager|AgentOrchestrator` en `src/pages/` no encuentra importadores. El hook real (con aprobación humana, `approve`/`reject`/`clear`, `EventBus.emit('agent.approved')`) **no se invoca en ninguna página**. La aprobación humana anunciada por el README ("All actions require human approval before execution", ver `Settings.jsx:104-105`) es **no operativa**: no hay UI para revisar y aprobar acciones.
- **Recomendación:** Cablear `useAgentManager` a una UI (p.ej., panel en Dashboard o Settings) que muestre `pending`, `approved`, `rejected` y botones de aprobación. Enlazar con `NotificationService.start()` para emitir eventos al aprobar.

### 4.6 Notificaciones

#### H-NT-01 — NotificationService nunca arranca (cadens EventBus rota en ambos extremos) (ALTO)
- **Archivos:** `src/services/notifications/NotificationService.js:13-49`, `src/services/core/EventBus.js`
- **Problema:** NotificationService.start() sólo se ejecuta si alguien lo llama. `grep NotificationService.start` en `src/`: 0 ocurrencias fuera de la propia clase. Además, `grep covenant.breach|anomaly.detected` en `src/`: las únicas menciones son (a) los _listeners_ dentro de NotificationService y (b) el JSDoc de EventBus. **Ningún emisor** en `AnomalyService`, `CovenantService` o cualquier servicio emite `covenant.breach` o `anomaly.detected`. El único `EventBus.emit` relevante es `agent.proposed` en AgentOrchestrator (línea 93), mismo que está huérfano.
- **Conclusión:** La cadena de notificaciones está muerta por partida doble: emisores inexistentes + consumidor nunca suscrito. README: "Smart Notifications — event-bus driven notifications for breaches, anomalies and agent actions" es una claim no implementada en行为.
- **Recomendación:** (1) Que `CovenantService.evaluate` emita `covenant.breach` para breaches críticos; que `AnomalyService.detect` emita `anomaly.detected` para cada hallazgo. (2) Arrancar `NotificationService` en `main.jsx` o App y exponer una campana en Navbar que lea `unreadCount`/`list`. (3) Cablear canales reales (email/SMS/web-push) y persistir queue en backend.

### 4.7 Frontend / UI

#### H-UI-01 — MetricCard delta sin ×100 (7.2% → "0.1%") (ALTO)
- **Archivo:** `src/components/charts/MetricCard.jsx:51`
- **Código:** `{Math.abs(delta).toFixed(1)}{deltaSuffix}`
- **Problema:** Los valores delta provienen como decimales (e.g., `kpis.revenueGrowth = 0.072` ≡ 7.2%, `kpis.marginDelta = 0`, `forecast.expectedGrowth`). El componente **no multiplica por 100**. Resultado: un crecimiento del 7.2% se renderiza como "0.1%". La gravedad es doble: (a) el número mostrado es erróneo por ~72× y siempre "aplastado" cerca de 0.0%(0.0–0.1%), dando la falsa impresión de estancamiento; (b) inconsistente con `fmt.percent` (`formatters.js:35-41`) que **sí** multiplica por 100 — el codebase conoce la convención pero `MetricCard.delta` la ignora.
- **Consumidores:** `Dashboard.jsx:53` (`delta={kpis.revenueGrowth}`), `Dashboard.jsx:54` (`delta={kpis.marginDelta}`), `Forecast.jsx:64` (`delta={forecast.expectedGrowth}`).
- **Recomendación:** `Math.abs(delta * 100).toFixed(1)` en `MetricCard.jsx:51` y `<AccessibilitySign${delta>0}+` según tono confirmando. Validar con un test visual que 0.072 → "7.2%", 0 → "0.0%", −0.03 → "−3.0%" (signo vía icono).

#### H-UI-02 — Sin ErrorBoundary (MEDIO)
- **Archivos:** `src/App.jsx`, `src/main.jsx`
- **Problema:** `grep ErrorBoundary|componentDidCatch` en `src/` → 0 ocurrencias. La app sólo envuelve `Routes` con `Suspense` (lazy loading). Cualquier excepción lanzada al renderizar una página (incluida una bug de MetricCard.delta×100 o un dataset mal formado) provoca **página en blanco** con sin feedback al usuario.
- **Recomendación:** Añadir un `ErrorBoundary` class component (o usar `react-error-boundary`) en `App.jsx` envolviendo `Routes`, con fallback "Algo salió mal — recarga / reporta" y `console.error` opcional hacia un servicio de tracking (P1: Sentry).

#### H-UI-03 — Sin ruta 404 / catch-all (BAJO)
- **Archivo:** `src/App.jsx:24-31`
- **Problema:** Sólo 5 rutas declaradas (`/`, `/dashboard`, `/analysis`, `/forecast`, `/settings`). Navegar a `/xyz` no matchea → render vacío. En una SPA con `vercel.json` rewrites a `/index.html`, el usuario ve una SPA montada con `<Routes>` sin match → pantalla en blanco típicamente con Navbar/Sidebar (en rutas anidadas) o totalmente en blanco.
- **Recomendación:** Añadir `<Route path="*" element={<NotFound/>} />` al final. `NotFound` simple con CTA a `/dashboard`.

#### H-UI-04 — Switch de Settings sin nombre accesible (WCAG 2.2 SC 4.1.2) (MEDIO)
- **Archivo:** `src/pages/Settings.jsx:82-96`
- **Código:** `<button type="button" role="switch" aria-checked={notifications[item.key]} onClick={...}>` — sin `aria-labelledby` ni `aria-label` que asocie el `<div>` hermano con el label/descripción del ítem.
- **Problema:** El botón switch **no tiene nombre accesible**. Un lector de pantalla anuncia "switch, pressed" pero no identifica qué control es ("Anomaly alerts", "Covenant breaches", etc.). El README declara WCAG 2.2 AA; este caso falla SC 4.1.2 (Name, Role, Value).
- **Recomendación:** Añadir `aria-label={item.label}` y `aria-describedby` apuntando al `<p>` de la descripción, o envolver label y control en un `<label>` y usar `htmlFor`. Verificar con axe-core y NVDA.

#### H-UI-05 — Botones decorativos sin `onClick` (MOCK) (MEDIO)
- **Archivo:** `src/pages/Settings.jsx:64,113,132`; `src/pages/Dashboard.jsx:50`
- **Código:**
  - `Settings.jsx:64`: `<Button size="sm">Save profile</Button>` — sin onClick.
  - `Settings.jsx:113`: `<Button size="sm" variant="outline">Edit capabilities</Button>` — sin onClick.
  - `Settings.jsx:132`: `<Button size="sm" variant="secondary">Manage integrations</Button>` — sin onClick.
  - `Dashboard.jsx:50`: `<Button variant="secondary" size="sm">Export</Button>` — sin onClick.
- **Problema:** Botones que parecen accionables pero no desencadenan acción alguna. El usuario cree poder exportar / guardar; la UI calla. Daño a la confianza del producto.
- **Recomendación:** Para cada uno, o (a) implementar el callback (Export → descargar JSON/CSV; Save → POST al backend; Edit capabilities → modal con checkboxes; Manage integrations → wizard), o (b) mostrar estado "Próximamente"/`disabled` con `tooltip`. Nunca mostrar accionable sin accion.

#### H-UI-06 — Claims decorativos "2FA Enabled" / "Data residency US-East" (MEDIO)
- **Archivo:** `src/pages/Settings.jsx:126,130`
- **Problema:** Badges que afirman capacidades no implementadas: no existe flujo 2FA, no existe configuración de data residency. Risk: compliance claim sin sustento (potencialmente uso engañoso ante un auditor o cliente).
- **Recomendación:** Retirar claims hasta implementar; o mostran como "Not enabled" en gris con CTA a configurar. En P1, implementar 2FA TOTP real y selector de región.

### 4.8 Modelo de datos

#### H-DA-01 — Modelo de datos de 4 campos/mes hardcoded (ALTO)
- **Archivo:** `src/data/datasets.js:9-22`
- **Shape por período:** `{ month, revenue, expenses, cash, budget }`
- **Problema:** El modelo embebido es **insuficiente para las métricas declaradas**: no contiene `cogs`, `ar` (cuentas por cobrar), `ap` (cuentas por pagar), `debt` (corto/largo plazo), `equity`, `inventory`, `opex`, `capex`, ni granularidad por división. Por diseño **imposibilita** `Gross Profit` (H-FIN-01), `Current Ratio` (H-FIN-03), `Operating Margin` (H-FIN-04), `Debt-to-Equity` (covenant c2) y `Cash conversion cycle`. Todos estos KPIs/covenants se muestran en la UI con números inventados o `undefined`.
- **Recomendación (P1):** Definir el modelo canónico: `MonthlyFinancial` con subcampos P&L (revenue, cogs, grossProfit, opex, ebitda, interest, tax, netIncome) + balance (cash, ar, inventory, ap, shortDebt, longDebt, equity) + cash flow (cfo, cfi, cff, capex). Persistir en PostgreSQL. Sustituir `MONTHLY_FINANCIALS` por datasource real en una capa `repository`.

#### H-DA-02 — `INDUSTRY_BENCHMARKS` hardcoded; 4 de 9 no se consumen (MEDIO)
- **Archivo:** `src/data/datasets.js:24-34`, `src/services/financial/BenchmarkService.js:19-25`
- **Problema:** 9 benchmarks definidos pero sólo 5 se comparan en `defs`. `currentRatio`, `debtToEquity`, `customerAcquisitionCost`, `lifetimeValue` se omiten silenciosamente. Los benchmarks son constantes, no datos reales de industria.
- **Recomendación (P2):** Fuente de benchmarks real (S&P, BITA, RMA). Exponer las 9 métricas.

### 4.9 Persistencia, ingesta y backend

#### H-PB-01 — Sin persistencia (localStorage/IndexedDB/API) (ALTO)
- **Archivos:** `src/` completo
- **Problema:** `grep localStorage|sessionStorage|indexedDB|fetch\(|axios|express|papaparse` en `src/` → **0 ocurrencias**. La app no retiene:
  - Filtros seleccionados yéndose entre recargas.
  - El `profile` editado en Settings (recarga → reset a Acme Corp).
  - Las `notifications` configuradas.
  - Las aprobaciones del agente (`useAgentManager.approve` no persiste).
- **Recomendación (P1):** Capa de persistencia mínima (localStorage para preferencias UI) + API + PostgreSQL para datos financieros reales.

#### H-PB-02 — Sin ingesta (CSV/Excel/banking) (ALTO)
- **Archivos:** ausente
- **Problema:** README: "Replace with real data sources in production" pero no hay mecanismo. `VITE_API_URL` declarado en `.env.example` no consumido por `fetch` alguno. Settings declara "Accounting connector: Not connected" sin código.
- **Recomendación (P1/P4):** Importador CSV/Excel con dry-run y `DataValidator` (extendido por H-FIN-08); script de migración; conectores Plaid/QuickBooks/Xero/Stripe/ERP (P4).

#### H-PB-03 — Sin backend ni API (ALTO)
- **Problema:** SPA pura. No hay endpoints, no hay auth, no hay lógica servidor-side. Cualquier cálculo financiero sensible se ejecuta en el navegador, exponiendo el modelo y datos al cliente.
- **Recomendación (P1):** Backend (Node/Fastify o Python/FastAPI) con endpoints por servicio financiero, möglich server-render de KPIs sensibles.

### 4.10 Multi-tenancy y SaaS

#### H-SAAS-01 — Sin auth, sin orgs, sin RBAC, sin audit log (ALTO)
- **Problema:** La app no tiene noción de usuario, organización, rol, permiso. Todos los datos son globales (Acme Corp). No hay login ni guard de rutas. No hay audit trail persistente de aprobaciones del agente.
- **Impacto:** No es SaaS. No hay forma de servir a múltiples clientes con aislamiento. Cualquier intento de multi-tenancy sobre el estado actual mezclaría datos.
- **Recomendación (P1):** Auth (NextAuth/Clerk/Auth.js), modelo Org/Tenant, RBAC (admin/finance/approver/viewer), data isolation por `tenantId`, audit log inmutable de acciones del agente.

### 4.11 Seguridad y DevOps

#### H-SEC-01 — react-router-dom@6.30.4 vulnerable (runtime, open redirect) (ALTO)
- **Archivo:** `package.json:19`; `npm ls` confirma `react-router-dom@6.30.4` → `react-router@6.30.4`
- **Advisories (npm audit):**
  - `GHSA-wrjc-x8rr-h8h6` (moderate): React Router open redirect via backslash in `<Link>` and `useNavigate` (bypass de CVE-2025-68470).
  - `GHSA-337j-9hxr-rhxg` (moderate): Arbitrary Constructor Injection via `deserializeErrors()` en SSR Hydration.
- **Rango afectado:** `react-router 6.0.0 – 7.17.0`; fix via `npm audit fix` (upgrade dentro de 6.x o a 7.x).
- **Impacto:** open redirect → vector de phishing (URL `https://app…//attacker.com`) → credential harvesting → effectively XSS en escenarios SSR.
- **Recomendación:** Aplicar `npm audit fix` (sube a 6.x latest con parche) o migrar a `react-router@7.x`. Validar que `Link`/`useNavigate` no acepten backslash-slash en user-controlled URLs.

#### H-SEC-02 — Patrón inseguro `VITE_` para API keys en `.env.example` (ALTO)
- **Archivo:** `.env.example:3-4`
- **Código:** `VITE_ANTHROPIC_KEY=sk-ant-...` y `VITE_OPENROUTER_KEY=sk-or-...`
- **Problema:** Cualquier variable con prefijo `VITE_` **se incrusta en el bundle del navegador** (Vite la reemplaza en build time). Si se introducen aquí claves reales, cualquier visitante del sitio puede inspeccionar el bundle y extraerlas. El patrón enseña a los developers a poner secretos de proveedores LLM en `VITE_`, lo que conduce a una fuga inevitable. (Adicionalmente, `grep` en `src/` de `ANTHROPIC_KEY`/`OPENROUTER_KEY`/`import.meta.env` no encontró usos — las claves ni siquiera se referencian; el `.env.example` es _instructivo_ peligroso.)
- **Recomendación:** (a) Eliminar `VITE_ANTHROPIC_KEY`/`VITE_OPENROUTER_KEY` de `.env.example`. (b) Las claves LLM deben vivir en el **backend** (variables de entorno servidor); el frontend las invoca vía proxy propio. (c) Documentar en README `Backend: ANTHROPIC_KEY (sin VITE_)`. (d) Dejar `VITE_API_URL` como única var frontend pública.

#### H-SEC-03 — `vercel.json` sin security headers (MEDIO)
- **Archivo:** `vercel.json`
- **Código:** sólo `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`
- **Problema:** Ausencia de: `Content-Security-Policy` (contra XSS/injection), `X-Frame-Options: DENY` o `frame-ancestors` (clickjacking), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `Strict-Transport-Security` (HSTS). Para una app financiera esta omisión es material.
- **Recomendación:** Añadir `headers` en `vercel.json`:
  ```json
  "headers": [
    { "source": "/(.*)", "headers": [
      { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.finflow.app; font-src 'self' https://fonts.gstatic.com; frame-ancestors 'none';" },
      { "key": "X-Frame-Options", "value": "DENY" },
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
      { "key": "Permissions-Policy", "value": "geolocation=(), microphone=(), camera=()" },
      { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" }
    ]}
  ]
  ```

#### H-SEC-04 — 4 vulnerabilidades tooling (devDep) (BAJO)
- **npm audit:** esbuild@0.21.5 (moderate, vía vite@5.4.21), postcss@8.5.15 (high, path traversal sourceMappingURL), nanoid@3.3.15 (high, loop indefinido), además de H-SEC-01 runtime.
- **Comentario:** PostCSS y nanoid son devDeps (no se ejecutan en runtime del navegador del usuario). Esbuild se ejecuta en el dev server del developer; GHSA-67mh-4wv8-2f99 permite que sitios maliciosos envíen requests al dev server del developer — **riesgo para developers locales**, no para el desplegado producción. Aun así, conviene parchar.
- **Recomendación:** `npm audit fix` para postcss/nanoid (no breaking); `npm audit fix --force` para vite (breaking, evalúa siguiente major). Pin de versiones en `package.json` con renovación periódica.

#### H-SEC-05 — `robots.txt` permeable y con rutas inexistentes (BAJO)
- **Archivo:** `public/robots.txt:18-22`
- **Código:** `User-agent: *` → `Allow: /`, `Allow: /app`, `Allow: /blog`, `Disallow: /app#`. Sitemap: `https://afde.vercel.app/sitemap.xml`.
- **Problema:** (a) `Allow: /` deja indexar todo el SPA, incluidas rutas internas (`/dashboard`, `/analysis`, `/forecast`, `/settings`). Los crawlers están permitidos para GPTBot/ClaudeBot/PerplexityBot/ChatGPT-User/Google-Extended (opción GEO válida). (b) `/app` y `/app#` no existen en `App.jsx` (rutas reales: `/`, `/dashboard`, `/analysis`, `/forecast`, `/settings`). Disallow fragmentario sin efecto.
- **Recomendación:** Disallow explícito de rutas internas (`/dashboard`, `/analysis`, `/forecast`, `/settings`) si se prefiere no indexar la app privada; corregir rutas inexistentes (`/app`). Validar `sitemap.xml` contra rutas reales.

#### H-SEC-06 — `.gitignore` incompleto y duplicado (BAJO)
- **Archivo:** `.gitignore`
- **Problema:** Duplica `.vercel` (líneas 7 y 10). Omite `.env.production`, `.env.*.local`, `coverage/`, `.eslintcache`, `.vscode/`, `.idea/`, `*.tsbuildinfo`, `npm-debug.log*`, `.cache/`. Riesgo menor de commitear secretos o artefactos.
- **Recomendación:** Limpiar duplicado y añadir patrones estándar (Node/Vite): `.env*`, `coverage/`, `.eslintcache`, `.vscode/`, `.idea/`, `*.log`, `npm-debug.log*`, `*.tsbuildinfo`, `.cache/`.

#### H-SEC-07 — Sin CI/CD ni monitoring (MEDIO)
- **Problema:** `glob` de `.github/`, `Dockerfile`, `.gitlab-ci.yml` → 0 archivos. Sin pipeline de build/test/lint, sin deploy gate. Sin Sentry/OTel/datadog. Errores runtime → pantalla en blanco silenciosa.
- **Recomendación (P1):** GitHub Actions con steps: install → lint → test → build → deploy a Vercel (preview por PR, prod por tag). Integrar Sentry para frontend (con source maps en release) y tracking básico de errores en `ErrorBoundary`.

### 4.12 Testing y calidad

#### H-TEST-01 — 0 tests; `npm run lint` falla (ALTO)
- **Evidencia:** `glob **/*.test.*` → 0 archivos. `package.json` no tiene script `test`. `npm run lint` → `"eslint" no se reconoce como un comando` (`eslint` no está en `devDependencies`).
- **Impacto:** Cualquier cambio futuro puede romper cálculos sin detección. No hay gate de registro de errores previo a deploy. El script `lint` documentado en README no funciona.
- **Recomendación (P1):** Instalar `eslint`+`eslint-plugin-react`+`eslint-plugin-react-hooks`+`eslint-plugin-jsx-a11y` y corregir warnings. Instalar `vitest`+`@testing-library/react` y añadir suites para: MathUtils, KPICalculator (con fixtures), ForecastingService (incluyendo test de intervalo correcto), AnomalyService, VarianceService, CovenantService (con kpis), CashFlowService (incluyendo stressTest), DataValidator. Añadir a CI.

---

## 5. Priorización

### P0 — Corregir fórmulas y datos antes de seguir (bloquea todo)

Objetivo: que los números mostrados sean correctos. Sin esto, cualquier trabajo posterior valida errores.

| # | Acción | Hallazgo | Esfuerzo |
|---|--------|----------|---------|
| P0-1 | Sustituir `grossProfit = revenue * 0.7` por `Revenue − COGS`; ampliar el modelo con `cogs` (o marcar `null`). | H-FIN-01, H-DA-01 | M |
| P0-2 | Corregir `marginDelta` para comparar `netMargin` del último período vs el anterior. | H-FIN-02 | S |
| P0-3 | Corregir `currentRatio = Current Assets / Current Liabilities`; añadir componentes al modelo. | H-FIN-03, H-DA-01 | M |
| P0-4 | Renombrar/re-calculación de `operatingMargin` (EBIT/revenue) o marcar `null` si no hay opex. | H-FIN-04 | S |
| P0-5 | En `BenchmarkService.compare` alinear `operatingMargin` (ambos partes) y exponer las 9 métricas (o marcar `null`). | H-FIN-05 | S |
| P0-6 | `CovenantService.evaluate(period, covenants, kpis)` — pasar kpis; propagar en `resolveMetric`. | H-FIN-06 | S |
| P0-7 | Corregir fórmula del intervalo de predicción (`t_{α/2,n-2}`, `Sxx = n(n²−1)/12`, distancia a `x̄`). | H-FC-01 | M |
| P0-8 | Corregir `expectedGrowth` para usar `last[metric]` en `ForecastingService` (H-FC-02) | S |
| P0-9 | Corregir `MetricCard.delta`: `Math.abs(delta * 100).toFixed(1)`. | H-UI-01 | XS |
| P0-10 | Renombrar `AgentOrchestrator`/capabilities en README a "rules-based" mientras no haya IA real; corregir fail-open (default 0 caps). | H-AG-01, H-AG-03 | S |
| P0-11 | Eliminar `VITE_ANTHROPIC_KEY`/`VITE_OPENROUTER_KEY` de `.env.example` y documentar el patrón backend. | H-SEC-02 | XS |
| P0-12 | Aplicar `npm audit fix` (react-router). | H-SEC-01 | XS |

**Criterio de salida P0:** suite de tests unitarios (H-TEST-01) que demuestren que cada cálculo produce el valor esperado sobre fixtures controlados. **No se puede progresar a P1 sin un green suite P0.**

### P1 — Fundación producto real (backend, datos, auth, multi-tenancy)

| # | Acción | Hallazgo |
|---|--------|----------|
| P1-1 | Definir modelo canónico `MonthlyFinancial` (P&L + Balance + CFlow) en PostgreSQL (Prisma/Drizzle). Migraciones reproducibles. | H-DA-01 |
| P1-2 | Implementar backend (Node/Fastify o Python/FastAPI) con endpoints por servicio financiero; lógica sensible servidor-side. | H-PB-03 |
| P1-3 | Auth (email/pass + 2FA TOTP real, eliminar badge decorativo), sesión, JWT/cookie, RBAC (admin/finance/approver/viewer). | H-SAAS-01, H-UI-06 |
| P1-4 | Modelo `Org`/`Tenant`; aislamiento por `tenantId` en todas las queries; `userId` en sesión. | H-SAAS-01 |
| P1-5 | Audit log inmutable (append-only) de todas las acciones del agente: propose/approve/reject, con `userId`, `orgId`, `timestamp`, `rationale`. | H-SAAS-01, H-AG-04 |
| P1-6 | Importador CSV/Excel con dry-run y `DataValidator` extendido (H-FIN-08); mapping por plantillas; errores por fila. | H-PB-02, H-FIN-08 |
| P1-7 | Persistencia de preferencias UI (localStorage) + persistencia real de profile/notifications/approvals (backend). | H-PB-01, H-UI-05 |
| P1-8 | Cablear `useAgentManager` y `NotificationService` a la UI; arrancar `NotificationService.start()`; emisores (CovenantService, AnomalyService) — completan la cadena. | H-AG-04, H-NT-01 |
| P1-9 | Implementar `Export` (CSV/JSON/XLSX), `Save profile`, `Edit capabilities` (modal con checkboxes que persiste caps), `Manage integrations` (wizard o estado "Not connected" real). | H-UI-05 |
| P1-10 | `ErrorBoundary` + ruta 404 + `aria-label` en switch. | H-UI-02, H-UI-03, H-UI-04 |
| P1-11 | CI/CD: GitHub Actions (install → lint → test → build → deploy preview/prod). Sentry. Headers en `vercel.json`. | H-TEST-01, H-SEC-03, H-SEC-07 |
| P1-12 | ESLint install + config + pre-commit; Vitest + Testing Library con P0 suite. | H-TEST-01 |

### P2 — Profundización del motor financiero

| # | Acción | Hallazgo |
|---|--------|----------|
| P2-1 | **Financial Statement Engine**: P&L, Balance Sheet, Cash Flow Statement (CFO/CFI/CFF) con reconciliación; reporting por período y consolidado. | H-CF-02, H-DA-01 |
| P2-2 | **Scenario Engine**: escenarios what-if (revenue shock, expense inflation, DSO delay) con comparativa side-by-side; cablear `stressTest` corregido (÷4.33 y collection delay gradual). | H-CF-01, H-CF-02, H-CF-03 |
| P2-3 | **Risk Engine**: runway con modelos probabilísticos, sensitivity, liquidity at risk (LAR). | H-FIN-03 |
| P2-4 | **Forecasting avanzado**: scegliere estrategia por_DELTA (lineal, Holt-Winters, ARIMA), backtesting con MAE/RMSE/MAPE/WAPE/Bias/Coverage, selección automática por AIC, intervalos calibrados. | H-FC-01, H-FC-03 |
| P2-5 | **Anomalías avanzadas**: IQR + seasonal-trend decomposition (STL) + ESD iterativo + FDR (Benjamini-Hochberg) + thresholds por industria. | H-AN-01, H-AN-02 |
| P2-6 | **Benchmarking real**: fuente externa de benchmarks por industria (RMA, BITA, S&P); percentiles; trend temporal; weightable peer set. | H-DA-02, H-FIN-05 |
| P2-7 | **Covenant monitoring cron**: evaluar periódicamente, disparar notificaciones y escalada; dashboard histórico de compliance. | H-FIN-06, H-NT-01 |

### P3 — Agente IA con trazabilidad

| # | Acción | Hallazgo |
|---|--------|----------|
| P3-1 | **AI Financial Analyst**: LLM (Anthropic/OpenRouter vía backend, claves en servidor) con contexto inyectado (kpis, anomalies, covenants, forecast, variances) y prompt estructurado que produce acciones dentro del enum `CAPABILITIES`. | H-AG-01 |
| P3-2 | **Explainability**: cada acción debe traer evidencia cita textual de los datos (file:line de la anomalía, valor vs threshold), no un rationale genérico. | H-AG-02 |
| P3-3 | **Human approval UX**: panel que muestre `pending`, `approved`, `rejected`, con flujo de revisión, comentarios del approver, multi-approver según `severity`. | H-AG-04 |
| P3-4 | **Agent audit log**: append-only, queryable, exportable; cada step (propose → review → approve/ reject → executed) trazado. | H-SAAS-01 |
| P3-5 | **Guardrails**: fail-closed por defecto, rate limit por capability, presupuesto/costo por request, off-switch kill switch. | H-AG-03 |

### P4 — Integraciones

| # | Acción | Hallazgo |
|---|--------|----------|
| P4-1 | **Banking APIs**: Plaid/GoCardless/MX para ingest de transacciones y balances. | H-PB-02, H-PB-03 |
| P4-2 | **Accounting connectors**: QuickBooks Online, Xero, Wave — sincronización de P&L y Balance. | H-UI-05, H-PB-02 |
| P4-3 | **Payment providers**: Stripe (cobranza), NAFTA/MercadoPago regionales — para AR aging real. | H-PB-02 |
| P4-4 | **ERP**: NetSuite/SAP/Dynamics para empresas mid-market: import periódico y recon. | H-PB-02 |
| P4-5 | **EDGAR/Yahoo Finance**: beta sectorial para benchmarks dinámicos (P2-6). | H-DA-02 |

---

## 6. Anexo — Evidencia de verificación

### 6.1 Trazabilidad de verificación por hallazgo

A continuación se detalla qué verificó el auditor de consolidación (V) para cada bloque de hallazgos, en contraste con el diagnóstico heredado (D) del solicitante. _"D said → V confirmed with evidence"_.

| Hallazgo heredado (D) | Verificación independiente (V) | Resultado |
|---|---|---|
| KPICalculator `grossProfit = revenue*0.7` | Leído `KPICalculator.js:22` literal | ✅ Confirmado; además `grossMargin = revenue*0.7/revenue = 0.7` constante. |
| KPICalculator `marginDelta = pctChange(netMargin, netMargin)` | Leído `KPICalculator.js:29` + `MathUtils.pctChange` (línea 60-63) | ✅ Confirmado: mismo valor a ambos lados → siempre 0; guard de `pctChange` también fuerza 0 si `prev=0`. |
| `currentRatio = cash/expenses` | Leído `KPICalculator.js:55-58`: `currentAssets = record.cash`; `currentLiabilities = Math.max(record.expenses, 1)` | ✅ Confirmado. |
| `operatingMargin = (revenue-expenses)/revenue` (es net margin) | Leído `KPICalculator.js:59` | ✅ Confirmado; además `BenchmarkService.js:23` lo re-mapea. |
| `CovenantService.evaluate` sin pasar kpis | Leído `CovenantService.js:29-32` (línea 32 con 2 args) y `Forecast.jsx:27` (mismo patrón) | ✅ Confirmado; además c2/c3/c4 unresolved en `datasets.js:38-40`. |
| `ForecastingService` intervalos `lower/upper` | Leído `ForecastingService.js:61`; contrasté con fórmula `t_{α/2,n-2}·s·√(1+1/n+(x₀−x̄)²/Sxx)` | ✅ Confirmado: z en vez de t, `n` en vez de `Sxx = n(n²−1)/12`, distancia a `(n−1)` en vez de a `x̄=(n−1)/2`. Para n=12: factor ~3.5× (denominador 11.9× + extrap 42× + z vs t 14%). |
| `MetricCard.jsx ~51` delta×100 faltante | Leído `MetricCard.jsx:51`; contrasté con `Dashboard.jsx:53` (`delta={kpis.revenueGrowth}` = decimal 0.072) y `formatters.js:36-41` (`fmt.percent` SÍ ×100) | ✅ Confirmado: `Math.abs(delta).toFixed(1)` sin ×100; inconsistente con `fmt.percent`. 7.2% → "0.1%". |
| AgentOrchestrator reglas if/else, FLAG_VENDOR, fail-open ~91 | Leído `AgentOrchestrator.js:32-91`: 5 bloques `if`; FLAG_VENDOR en 63-71; `capabilities.length === 0 ? all : capabilities` en 91 | ✅ Confirmado todo. |
| Settings switch sin nombre accesible ~82; botones sin onClick; 2FA decorativo | Leído `Settings.jsx:82-96` (switch sin `aria-label`); líneas 64/113/132 (Botones sin `onClick`); 126/130 (badges decorativos) | ✅ Confirmado. |
| datasets.js shape sin `cogs/AR/AP/debt/equity` | Leído `datasets.js:10-21`: solo `month, revenue, expenses, cash, budget` | ✅ Confirmado; además impide 5 KPIs centrales. |
| App.jsx sin ErrorBoundary ni 404 | Leído `App.jsx:1-33` (solo Suspense + 5 rutas); `grep ErrorBoundary|componentDidCatch` → 0 ocurrencias en `src/` | ✅ Confirmado. |
| vercel.json sin security headers | Leído `vercel.json` (solo `rewrites`) | ✅ Confirmado. |
| `.env.example VITE_ANTHROPIC_KEY / VITE_OPENROUTER_KEY` | Leído `.env.example:3-4`; `grep` en `src/` de estas vars → no referenciadas | ✅ Confirmado patrón inseguro (`VITE_` → bundle). |
| `npm audit`: 6 vulns (3 mod, 3 high, 0 critical) | Ejecutado `npm audit`: 6 vulns. Detalle: react-router (mod) runtime + esbuild (mod) + nanoid (high) + postcss (high). React-router GHSA-wrjc-x8rr-h8h6 y GHSA-337j-9hxr-rhxg. | ✅ Confirmado; IDs de advisories actualizados respecto del diagnóstico (D citó `GHSA-jjmj-jmhj-qwj2`; el audit local reporta `GHSA-wrjc-x8rr-h8h6` y `GHSA-337j-9hxr-rhxg`, sustancia idéntica). |
| 0 tests, no test script, `npm run lint` falla | `glob **/*.test.*` → 0 archivos; `package.json:13` sin script `test`; ejecutado `npm run lint` → error "eslint no se reconoce como comando" | ✅ Confirmado. |
| Sin backend/persistencia/auth/ingesta; datos hardcoded | `grep localStorage|sessionStorage|fetch\(|express|papaparse|axios|indexedDB` en `src/` → 0 ocurrencias; leído `datasets.js:9-22` | ✅ Confirmado. |
| BenchmarkService BROKEN (operatingMargin←netMargin) | Leído `BenchmarkService.js:23` | ✅ Confirmado; además `currentRatio/debtToEquity/CAC/LTV` omitidos en `defs`. |
| CashFlowService stressTest /4 semanas (~8% error), collection delay step, sin CFO/CFI/CFF | Leído `CashFlowService.js:37-38` (÷4), `:41` (step), no separa CFO/CFI/CFF | ✅ Confirmado ~8% error (1/4 vs 1/4.345). |
| AnomalyService 3-sigma + MoM z=±3.5 fijo, sin IQR/FDR/estacionalidad | Leído `AnomalyService.js:23-68` | ✅ Confirmado. |
| VarianceService REAL | Leído `VarianceService.js:12-26` y consumo en `Analysis.jsx:26` | ✅ Confirmado REAL. |
| MathUtils pctChange devuelve 0 si prev=0 | Leído `MathUtils.js:60-63` | ✅ Confirmado PARTIAL. |
| DataValidator solo tipos, no consistencia | Leído `DataValidator.js:24-50` | ✅ Confirmado PARTIAL. |
| useAgentManager REAL pero huérfano | Leído `useAgentManager.js` (implementa run/approve/reject/clear); `grep useAgentManager` en `src/pages/` → 0 importadores | ✅ Confirmado REAL + ORPHAN. |
| AgentOrchestrator / NotificationService / stressTest huérfanos | `grep stressTest|AgentOrchestrator|NotificationService` en `src/` → solo auto-referencias | ✅ Confirmado ORPHAN. |
| Cadena notificaciones rota (nadie emite covenant.breach/anomaly.detected; NotificationService.start nunca llamada) | `grep covenant.breach|anomaly.detected|NotificationService.start` → solo listeners en NotificationService.js y JSDoc en EventBus.js | ✅ Confirmado BROKEN cadena completa. |
| robots.txt expone rutas internas | Leído `robots.txt:18-22` (Allow: / + Allow: /app + Disallow /app#); rutas reales App.jsx no incluyen /app | ✅ Confirmado parcial: además referencia rutas inexistentes. |
| .gitignore incompleto | Leído `.gitignore` (duplica `.vercel` en líneas 7 y 10; omite patrones estándar) | ✅ Confirmado. |
| CI/CD MISSING; monitoring MISSING | `glob` de `.github/`, `Dockerfile`, `gitlab-ci` → 0 archivos; no Sentry/OTel en `src/` | ✅ Confirmado. |

### 6.2 Comandos ejecutados (reproducibles)

```powershell
# En C:\Users\jairo\Documents\aplicacion financiera\files\afde-complete-v2\afde-complete
git log --oneline -10
git status --short
git branch --show-current

npm audit                 # → 6 vulnerabilities (3 moderate, 3 high, 0 critical)
npm run lint              # → error: "eslint no se reconoce como un comando"
npm ls react-router-dom react vite postcss esbuild nanoid
# → react-router-dom@6.30.4 / react-router@6.30.4 / vite@5.4.21 / postcss@8.5.15 / esbuild@0.21.5 / nanoid@3.3.15
```

Búsquedas de archivos / contenido (herramientas `glob` y `grep` del entorno de auditoría):

```
glob  **/*.test.*                              → 0 archivos (sin tests)
glob  **/{.github,.gitlab-ci.yml,Dockerfile,...} → 0 archivos (sin CI/CD)
grep  stressTest|AgentOrchestrator|NotificationService|useAgentManager  en src/
      → 15 matches; todos auto-referencias o en su propio módulo; NINGÚN importador en src/pages/
grep  localStorage|sessionStorage|fetch\(|express|papaparse|axios|indexedDB  en src/
      → 0 matches (sin persistencia, sin backend, sin ingesta)
grep  ErrorBoundary|componentDidCatch|covenant\.breach|anomaly\.detected|NotificationService\.start  en src/
      → 5 matches: 2 listeners en NotificationService.js + 3 ocurrencias en EventBus.js JSDoc (no emisores)
```

### 6.3 Lectura de archivos fuente verificada (índice)

| Archivo | Líneas leídas | Verificación principal |
|---|---|---|
| `package.json` | 1-31 | Versión, scripts, deps sin `eslint`/`vitest` |
| `.env.example` | 1-6 | `VITE_ANTHROPIC_KEY`/`VITE_OPENROUTER_KEY` inseguros |
| `vercel.json` | 1-3 | Sin headers |
| `.gitignore` | 1-10 | Duplicado, incompleto |
| `README.md` | 1-160 | Claims "AI-powered", "WCAG 2.2 AA", "human approval", "Smart Notifications" contrastadas con código |
| `src/App.jsx` | 1-33 | Sin ErrorBoundary, sin ruta 404 |
| `src/data/datasets.js` | 1-56 | Shape 4 campos/mes; covenants c2/c3/c4 unresolvable |
| `src/services/core/MathUtils.js` | 1-77 | `pctChange` returns 0 si prev=0 |
| `src/services/core/DataValidator.js` | 1-83 | Solo tipos |
| `src/services/core/EventBus.js` | 1-63 | Implementación correcta, pero sin emisores reales |
| `src/services/financial/KPICalculator.js` | 1-83 | 4 errores de fórmula |
| `src/services/financial/BenchmarkService.js` | 1-53 | operatingMargin←netMargin; omite 4 métricas |
| `src/services/financial/CovenantService.js` | 1-66 | No pasa kpis |
| `src/services/financial/ForecastingService.js` | 1-82 | Intervalo inválido (~3.5× estrecho); expectedGrowth roto para metric≠revenue |
| `src/services/financial/AnomalyService.js` | 1-84 | 3-sigma, MoM z=±3.5 fijo |
| `src/services/financial/CashFlowService.js` | 1-57 | stressTest ÷4 (~8% error), step, orphan |
| `src/services/financial/VarianceService.js` | 1-46 | REAL |
| `src/services/agent/AgentOrchestrator.js` | 1-120 | Reglas if/else, FLAG_VENDOR, fail-open |
| `src/services/agent/useAgentManager.js` | 1-81 | REAL + ORPHAN |
| `src/services/notifications/NotificationService.js` | 1-97 | REAL + ORPHAN (start nunca llamada) |
| `src/components/charts/MetricCard.jsx` | 1-79 | delta sin ×100 |
| `src/utils/formatters.js` | 1-74 | `fmt.percent` SÍ ×100 — prueba la inconsistencia con MetricCard.delta |
| `src/pages/Dashboard.jsx` | 1-85 | `delta={kpis.revenueGrowth}` decimal; "Export" sin onClick |
| `src/pages/Analysis.jsx` | 1-142 | Variances real; benchmark/anomaly consumen servicios defectuosos |
| `src/pages/Forecast.jsx` | 1-126 | CovenantService sin kpis; band se muestra; delta en forecast MetricCard |
| `src/pages/Settings.jsx` | 1-140 | Switch sin a11y name; 4 botones MOCK; 2 badges decorativos |
| `vite.config.js` | 1-24 | ManualChunks + alias `@`; limpio |
| `public/robots.txt` | 1-26 | Allow: / + rutas inexistentes |

### 6.4 Discrepancias con el diagnóstico heredado

El auditor de consolidación confirma la sustancia de todos los hallazgos del diagnóstico del solicitante. Únicamente se documentan las siguientes matizaciones:

1. **react-router-dom advisory ID**: el diagnóstico citó `GHSA-jjmj-jmhj-qwj2`; la re-ejecución de `npm audit` local reporta `GHSA-wrjc-x8rr-h8h6` (open redirect via backslash, bypass CVE-2025-68470) y `GHSA-337j-9hxr-rhxg` (Arbitrary Constructor Injection SSR Hydration). Sustancia idéntica (open redirect → phishing/XSS); los IDs del advisory deben leerse de la última corrida.
2. **`operatingMargin` en `KPICalculator.ratiosFor`**: el diagnóstico lo ubica en `~55-59`. Confirmado: `operatingMargin` está en línea 59 dentro de `ratiosFor`. El cálculo `(revenue−expenses)/revenue` es net margin, no operating margin. Se confirma el mislabeling.
3. **Hallazgos adicionales no enumerados en el diagnóstico pero verificados durante la consolidación**:
   - `formatters.js` `fmt.percent` SÍ hace ×100 → prueba la inconsistencia de `MetricCard.delta`.
   - `INDUSTRY_BENCHMARKS` tiene 9 métricas pero `BenchmarkService.compare` solo compara 5 (omite `currentRatio`, `debtToEquity`, `CAC`, `LTV`).
   - La cadena EventBus→NotificationService está rota **en ambos extremos** (nadie emite `covenant.breach`/`anomaly.detected`; `start()` nunca se llama), no solo en `start`.
   - `.gitignore` duplica `.vercel`.
   - robots.txt referencia rutas inexistentes (`/app`) además de Allow: /.

### 6.5 Declaración de cumplimiento del protocolo

El auditor de consolidación siguió el protocolo "evidence before claims": para cada afirmación en §3-§4 localizó el archivo:línea exacto en el commit auditado y/o ejecutó un comando reproducible. Ningún hallazgo de este informe se redactó sin evidencia verificada en esta sesión. Las acciones recomendadas en §5 se dirigen a los owners de cada capa correspondientes; el rol del auditor es _discover_, no _fix_.

---

## Aprobación del release

| Criterio | Estado |
|---|---|
| ¿Alcance del README implementado? | ❌ No — claims IA, Notifications, Human approval, 2FA, integrations no operativos |
| ¿Cálculos financieros correctos? | ❌ No — 8 hallazgos BROKEN en motor financiero y forecasting |
| ¿Tests pasan? | ❌ No existen tests; `npm run lint` falla |
| ¿Sin CVEs runtime sin parchear? | ❌ react-router-dom@6.30.4 vulnerable |
| ¿Secretos gestionados de forma segura? | ❌ Patrón `VITE_` para API keys en `.env.example` |
| ¿Smoke tests en staging? | ❌ No hay staging ni smoke tests |
| **Recomendación final** | 🔴 **BLOQUEAR** para datos reales. Apto sólo como demo de portfolio tras resolver P0. |

El desbloqueo de la revisión está condicionado a:
1. Cerrar todos los hallazgos P0 con PRs revisados.
2. Añadir suite Vitest mínima (P0 suite) en verde.
3. Aplicar `npm audit fix` y verificar 0 vulns runtime.
4. Eliminar el patrón `VITE_` para secretos.
5. Alinear el README con la realidad (renombrar "AI-powered" a "rules-based" mientras corresponda, marcar features not implemented como "Coming soon").

---

**Fin del informe maestro de auditoría — FinFlow v2.0.0**
_Documento generado por el Ingeniero de Validación y Auditoría. Evidencia verificada de forma independiente el 2026-08-10. Este archivo es documentación; no modifica código de la aplicación._