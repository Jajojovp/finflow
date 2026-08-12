# FinFlow v3 — Auditoría de Preparación de Seguridad para Producción

- **Fecha:** 2026-08-11
- **Scope:** Repo FinFlow v3 (`afde-complete`) — SPA estática (Vite + React 18), despliegue Vercel.
- **Tipo:** Revisión pasiva (SCA, secret scanning, revisión de configs/headers). **No** pentest, **no** DAST, **no** fuzzing.
- **Ejecutor:** Ingeniero de Seguridad.
- **Specs vinculantes aplicados:** `09-security/security.spec.md` (R4, R5, R6, R7, R11), `09-security/owasp.spec.md` (R6, R12, R13).
- **Estado global:** `CONDITIONAL_PASS` — la vulnerabilidad `high` de supply chain está **REMEDIADA**; permanecen hallazgos pendientes que **bloquean** una declaración formal de “producción segura”.

---

## 1. Resumen ejecutivo

| Métrica | Antes | Después |
|---|---|---|
| `npm audit` critical/high/moderate/low | 0 / 1 / 1 / 0 (total 2) | 0 / 0 / 0 / 0 (total 0) |
| `npm run build` | n.e. | OK (2139 módulos, 24.13 s) |
| `npm test` | n.e. | OK (7 archivos, 68/68 pass) |
| `npm run lint` | n.e. | 0 errores, 14 warnings preexistentes |
| Secretos reales en working tree | No detectados | No detectados |
| SBOM publicada | No | No |
| Headers de seguridad (CSP/HSTS/XFO/XCTO/Referrer/Permissions) | Ausentes | **Pendiente** (decisión requerida) |

**Conclusión honesta:** El riesgo de supply chain `high` identificado fue remediado el mismo día con un upgrade no-breaking (Vite 5.4.21 → 6.4.3). **No obstante, el sistema no puede declararse “producción segura”** mientras queden controles pendientes (sección 6). La presente auditoría **no constituye** certificación OWASP/ISO 27001/PCI.

---

## 2. Hallazgos

### H-01 — Vite: bypass de `server.fs.deny` en rutas alternas de Windows (REMEDIADA)

- **Clase OWASP:** A06:2021 Vulnerable and Outdated Components (también toca A05 Misconfiguration del dev server).
- **Severidad:** **HIGH** (CVSS 7.5 — `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N`).
- **Advisory:** [GHSA-fx2h-pf6j-xcff](https://github.com/advisories/GHSA-fx2h-pf6j-xcff) — “vite: `server.fs.deny` bypass on Windows alternate paths”.
- **CWE:** CWE-22 (Path Traversal), CWE-200 (Information Exposure).
- **Rango vulnerable:** `vite <=6.4.2`.
- **Versión instalada (antes):** `vite@5.4.21` ⇒ **vulnerable**.
- **Causa exacta:** en el dev server, los chequeos de `server.fs.deny` (que delimitan qué ficheros fuera de la raíz del proyecto pueden servirse) no normalizaban rutas alternas de Windows (8.3 short names / `\\?\` / separadores mixtos). Un atacante que alcance el dev server podía trivialmente evadir el sandbox de filesystem y leer ficheros arbitrarios del host de desarrollo. Explotable únicamente contra el **dev server**, no contra el bundle de producción generado por `vite build`.
- **Impacto real en FinFlow:** exposición confidencial del entorno de desarrollo (código fuente y ficheros del host). El artefacto de producción (`dist/`) es una SPA estática y **no** incluye el dev server, por lo que la exposición en producción es baja, pero la regla `09-security/owasp.spec.md` R13 fija ventana **High = 30 días** y `security.spec.md` R6 exige que las vulns críticas/alto se remedien antes de release.
- **Remediación aplicada:** upgrade de `vite` a `^6.4.3` (exacto instalado: `vite@6.4.3`).
  - `@vitejs/plugin-react@4.7.0` ya admite `vite ^6.0.0` (peer dep `"vite": "^4.2.0 || ^5.0.0 || ^6.0.0 || ^7.0.0"`). No fue necesario cambiar el plugin.
  - `vitest@3.2.7` y sus sub-dependencias (`@vitest/mocker@3.2.7` admite `vite ^5.0.0 || ^6.0.0 || ^7.0.0-0`) son compatibles.
  - Node engine `^18.0.0 || ^20.0.0 || >=22.0.0` satisfecho.
- **Evidencia:** `docs/security/evidence/npm-audit-BEFORE-upgrade.json`, `docs/security/evidence/npm-audit-AFTER-upgrade.json`, `docs/security/evidence/npm-ls-after-upgrade.txt`.
- **Verificación post-fix:** `npm audit` ⇒ 0 vulns. `npm run build` ⇒ OK. `npm test` ⇒ 68/68 pass. `npm run lint` ⇒ 0 errores.
- **Estado:** `REMEDIADA` (misma sesión, dentro de la ventana de 30 días).

### H-02 — esbuild: dev server responde a requests cross-origin arbitrarias (REMEDIADA)

- **Clase OWASP:** A06:2021 + A05:2021.
- **Severidad:** **MODERATE** (CVSS 5.3 — `CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:H/I:N/A:N`).
- **Advisory:** [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99) — “esbuild enables any website to send any requests to the development server and read the response”.
- **CWE:** CWE-346 (Origin Validation Error).
- **Rango vulnerable:** `esbuild <=0.24.2`.
- **Versión instalada (antes):** `esbuild@0.21.5` (transitiva de Vite 5.4.21) ⇒ vulnerable.
- **Causa exacta:** el dev server de esbuild no validaba el `Origin` de las peticiones, permitiendo que cualquier sitio web abierto en el navegador del desarrollador enviara peticiones al dev server local y leyera la respuesta (robo de código fuente en sesiones de dev).
- **Remediación aplicada:** upgrade de esbuild transitivo a `esbuild@0.25.12` (Vite 6.4.3 declara `esbuild ^0.25.0`, fuera del rango vulnerable).
- **Estado:** `REMEDIADA` (mismo cambio que H-01).

### H-03 — Ausencia de headers de seguridad en el host y en `index.html` (ABIERTA)

- **Clase OWASP:** A05:2021 Security Misconfiguration.
- **Severidad:** **MEDIUM**.
- **Hallazgo:**
  - `index.html` no declara CSP ni metadatos de seguridad.
  - `vercel.json` sólo define reescrituras SPA (`rewrites`), **sin** bloque `headers`.
  - No hay evidencia de HSTS, `X-Content-Type-Options`, `X-Frame-Options` (o `frame-ancestors` en CSP), `Referrer-Policy`, `Permissions-Policy`.
- **Impacto:** la SPA es estática y sin auth propia, pero la ausencia de CSP/HSTS permite ataques de mixed content, clickjacking y MIME-sniffing en despliegue.
- **Remediación propuesta (no aplicada — requiere decisión):** añadir `headers` en `vercel.json` y/o CSP en `index.html`. **CSP debe calibrarse** con la lista de orígenes usados (Google Fonts: `fonts.googleapis.com`, `fonts.gstatic.com`; scripts inline de módulos Vite; estilos inline). Una CSP demasiado estricta rompe la renderización; por eso **no se aplica sin verificación en staging**. Diff propuesto disponible en sección 7.
- **Ventana objetivo (owasp.spec R13):** Medium = 90 días.

### H-04 — `.env.example` expone nombres de secretos con prefijo `VITE_` (ABIERTA)

- **Clase OWASP:** A02:2021 Cryptographic Failures / A05:2021.
- **Severidad:** **MEDIUM** (de diseño).
- **Hallazgo:** `.env.example` define `VITE_ANTHROPIC_KEY` y `VITE_OPENROUTER_KEY`. Toda variable con prefijo `VITE_` es **inlineada por Vite al bundle del cliente** y queda visible para cualquier usuario final.
- **Mitigación actual:** los valores son placeholders (`sk-ant-...`, `sk-or-...`); no existe `.env` real en disco; el código fuente de `src/` no consume `import.meta.env` (verificado). Por tanto **no hay fuga activa hoy**.
- **Riesgo:** si en el futuro se pueblan estas variables con claves reales, se filtrarán al bundle público. Viola `security.spec.md` R4 (rotación) y R11 (prohibido manejo manual de credenciales en producción).
- **Remediación recomendada:** eliminar `VITE_*KEY` del ejemplo; las llamadas a LLM deben vivir en un backend/edge function con la clave en un gestor de secretos (Vault/Secrets Manager), nunca con prefijo `VITE_`.

### H-05 — Faltan artefactos obligatorios por spec (ABIERTA)

- **Clase OWASP:** A08:2021 Software & Data Integrity Failures.
- **Severidad:** **MEDIUM** (gobernanza).
- **Hallazgos:**
  - Sin SBOM publicada por release (`security.spec.md` R7 / `owasp.spec.md` R8). `cdxgen` no está instalado; no se generó SBOM en esta sesión.
  - Sin threat model STRIDE publicado (`security.spec.md` R5) — el `security-scope.md` previo lo marcaba como pendiente.
  - SAST/SCA no automatizados en pipeline (`security.spec.md` R6). `semgrep` y `gitleaks` no están instalados; el SCA se ejecutó manualmente con `npm audit`.
- **Remediación recomendada:** ver sección “Próximos pasos obligatorios”.

---

## 3. Análisis de la remediación: ¿por qué Vite 6.4.3 y no Vite 8.2.1?

`npm audit` sugería `vite@8.2.1` como fix (salto SemVer-major). Elegir Vite 8 implicaba:

1. Requerir `@vitejs/plugin-react@6.x` que **sólo** admite `vite ^8.0.0` (peer deps `@rolldown/plugin-babel`, `babel-plugin-react-compiler`) — cambio mayor de tooling.
2. Migrar Vitest a 4.x (peer incompatible con Vite 8 en Vitest 3.x).
3. Riesgo de break en config actual (`rollupOptions.output.manualChunks`, alias `@`, `build.target 'es2020'`).

**Vite 6.4.3** alternativa óptima y segura:

- Está **fuera** del rango vulnerable (`<=6.4.2`).
- Sigue siendo soportada por `@vitejs/plugin-react@4.7.0` (sin tocar el plugin).
- Sigue soportada por `vitest@3.2.7` y sub-deps.
- Engine Node 18+ satisfecho.
- Esto repara **a la vez** H-01 (vite) y H-02 (esbuild) porque Vite 6.4.3 arrastra `esbuild ^0.25.0` (>0.24.2).
- Es la última release estable de la rama 6.x (6.4.3 = head de la línea 6.x parcheada).

**Riesgo residual del upgrade aplicado:** mínimo y verificado — build, tests y lint pasan sin cambios adicionales. Las 14 warnings de lint son preexistentes (a11y, `no-unused-vars`, directivas `eslint-disable` redundantes) y no tienen relación con el cambio.

---

## 4. Mapeo OWASP Top 10 (2021) — FinFlow SPA

Ver `docs/security/owasp-mapping.md` para el detalle por categoría. Resumen:

| Ref | Categoría | Estado para FinFlow |
|---|---|---|
| A01 | Broken Access Control | N/A (SPA sin auth ni backend propio) — pendiente si se añaden cuentas. |
| A02 | Cryptographic Failures | H-04 abierto (env vars con prefijo `VITE_`). |
| A03 | Injection | N/A (sin handlers server-side propios). |
| A04 | Insecure Design | Pendiente threat model STRIDE (H-05). |
| A05 | Security Misconfiguration | H-03 abierto (headers/CSP). |
| A06 | Vulnerable Components | **REMEDIADO** (H-01, H-02). |
| A07 | Auth Failures | N/A en la SPA actual. |
| A08 | Software & Data Integrity | H-05 abierto (SBOM/CI/CD). |
| A09 | Security Logging | N/A en SPA estática (deberá definirse en backend cuando exista). |
| A10 | SSRF | N/A. |

---

## 5. Estado de preparación para producción

**NO se declara producción segura.** Listado de bloqueadores para una afirmación formal:

1. **H-03** — aplicar headers de seguridad y CSP validada en staging.
2. **H-05** — publicar SBOM por release (CDX/SPDX) y automatizar SCA/SAST en CI.
3. **H-05** — completar threat model STRIDE y registrarlo.
4. **H-04** — diseñar el consumo de claves LLM vía backend/edge (no `VITE_*`).
5. Confirmar que el despliegue Vercel sirve la SPA sobre HTTPS/TLS 1.2+ y HSTS (fuera del scope pasivo actual; requiere verificación en staging).
6. Validación de claims del copy (AI/precisión) con producto — riesgo reputacional/regulatorio, no cubierto por esta auditoría técnica.

**Aprobado para promotions parciales:** el artifact `dist/` es apto para despliegue en **staging**; la decisión de **producción** requiere cierre de los items 1–4.

---

## 6. Verificación ejecutada (evidencia)

- `npm audit --json` antes: 1 high (vite) + 1 moderate (esbuild). Archivo: `docs/security/evidence/npm-audit-BEFORE-upgrade.json`.
- Cambio aplicado: `package.json` `vite ^5.1.0 → ^6.4.3`. `npm install`.
- `npm audit --json` después: 0/0/0/0. Archivo: `docs/security/evidence/npm-audit-AFTER-upgrade.json`.
- `npm ls vite esbuild` después: `vite@6.4.3`, `esbuild@0.25.12`. Archivo: `docs/security/evidence/npm-ls-after-upgrade.txt`.
- `npm run build`: 2139 módulos, build en 24.13 s, output `dist/` correcto.
- `npm test`: 7 archivos / 68 tests **pass** (KPICalculator, ForecastingService, AgentOrchestrator, CovenantService, BenchmarkService, MathUtils, CashFlowService).
- `npm run lint`: 0 errores, 14 warnings preexistentes (no introducidos por el upgrade).
- Secret scanning manual en working tree (regex de patrones reales `sk-ant-…+20`, `sk-or-…+20`, `AIza…`, `AKIA…`, `ghp_…`, `xox…-`, claves PEM): **0 hits reales** en `src/`, `public/`, configs e `index.html`. Las coincidencias en `.env.example` y docs son placeholders o menciones conceptuales.

---

## 7. Próximos pasos obligatorios (decisión requerida)

1. **Headers/CSP:** aplicar diff propuesto en `vercel.json` (sección 8) tras probar en staging. `Per owasp.spec R6` los hallazgos medios se remedian en ≤90 días.
2. **SBOM:** instalar `cdxgen` y emitir `sbom.cyclonedx.json` por release (`security.spec R7`).
3. **Pipeline:** añadir `npm audit` + `gitleaks` + `semgrep` (o CodeQL) en CI; bloquear PRs con vulns `high`/`critical` (`security.spec R6`).
4. **Threat model:** completar STRIDE y archivarlo en `docs/security/threat-model.md` (`security.spec R5`).
5. **Diseño de claves LLM:** plan de migración de `VITE_*KEY` a edge function con Secrets Manager (`security.spec R11`).
6. **Verificación TLS/HSTS en staging** (requiere cuenta Vercel):
   `testssl.sh` o `curl -I` con validación de cert y versión TLS ≥ 1.2, `Strict-Transport-Security` presente.
7. **Reauditar** tras aplicar 1–4; entonces re-evaluar declaración de producción.

## 8. Diff propuesto para H-03 (no aplicar sin staging)

`vercel.json` sugerido (CSP calibrada con Google Fonts + scripts/estilos inline de Vite):

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; media-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
        }
      ]
    }
  ]
}
```

> **Aviso:** si se añaden fuentes/scripts adicionales o analytics (AdSense ya referenciado en `.env.example`), la CSP debe ampliarse con sus orígenes exactos. Probar la SPA renderizada completa antes de promover a producción con esta CSP.

---

## 9. Referencias

- `09-security/security.spec.md` (R4, R5, R6, R7, R11).
- `09-security/owasp.spec.md` (R6, R12, R13).
- `docs/security/security-scope.md` (alcance previo, actualizado).
- `docs/security/owasp-mapping.md`.
- Advisories: GHSA-fx2h-pf6j-xcff, GHSA-67mh-4wv8-2f99, GHSA-4w7w-66w2-5vf9, GHSA-v6wh-96g9-6wx3.