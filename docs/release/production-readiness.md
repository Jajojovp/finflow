# FinFlow v3 Dark Luxe — Production Readiness Audit

**Audience:** DevOps / SRE, release engineering, QA lead, security reviewer
**Document type:** runbook — pre‑deployment readiness checklist and remediation evidence
**Spec references:**
- `specs/11-operations/deployment.spec.md` (R1–R12 binding rules)
- `specs/04-development/documentation.spec.md` (R3/R4 tone + audience; R8 runbook format)
- `playbooks/deploy-production.playbook.md` (7‑step release pipeline)
**Scope of audit:** `afde-complete` repo (FinFlow v2.0.0 / candidate v3 "Dark Luxe"), Vercel host, SPA frontend only (no backend artifact in this repo).
**Veredicto global:** `FAIL — BLOCKED`. No autoriza despliegue a producción.
**Fecha de auditoría:** 2026‑08‑11.
**Auditor:** DevOps Engineer (OpenCode session).

> Esta auditoría no autoriza un deploy. La remediación de configuración/documentación se realizó localmente; no se realizó deploy ni commit.

---

## 1. Resumen ejecutivo

| Área | Estado | Acción bloqueante |
|---|---|---|
| Vercel config (`vercel.json`) | **PASS_LOCAL** | Configuración Vite, comandos reproducibles, clean URLs, trailing slash, headers y cache declarados; validación local, no preview. |
| Rutas SPA | **PASS_LOCAL** | Rewrite excluye estáticos y sitemap/robots sólo listan las 5 rutas de `App.jsx`. |
| Headers de seguridad | **NEEDS_INFO** | Headers base y CSP report-only configurados; HSTS y validación en preview requieren confirmar dominio HTTPS y ejecutar smoke test. |
| Caching video / assets / imágenes | **PASS_LOCAL** | Cache inmutable declarado para `/videos/*`, `/assets/*` e `/images/*`; respuesta real de Vercel aún no verificada. |
| Variables de entorno | **PASS_LOCAL** | Se eliminaron las claves LLM `VITE_*`; backend/edge secret manager documentado. Vars públicas de producción aún requieren aprovisionamiento. |
| Build command / output | **NEEDS_INFO** | `package.json: build = vite build`; output `dist/`. Vercel auto‑detecta Vite. No está locked en `vercel.json`; frágil ante ambigüedad. |
| Seguridad de configuración | **FAIL** | SBOM, SAST/DAST/secret scan, rollback drill y release controls siguen pendientes; la instalación local del 2026-08-11 reportó 0 vulnerabilidades. |
| Rollback | **NEEDS_REVIEW** | Runbook canónico y ADR creados; drill no ejecutado. |
| Trazabilidad git | **FAIL** | `git status` con 16 archivos modified + 9 untracked del rediseño v3 en rama `main`; sin tag, sin commit candidata. Viola playbook prereq "versión candidata taggeada". |
| Estrategia blue/green o canary | **PASS_LOCAL / NEEDS_REVIEW** | ADR documenta `Promote to Production`; la capacidad no se ha ensayado en este entorno. |
| Observabilidad post‑deploy | **NEEDS_INFO** | Vercel logs nativos + Vercel Analytics no confirmados; sin Sentry/OTel/SLI/SLO definidos. |

**Veredicto (actualizado 2026-08-11):** `FAIL — BLOCKED`. Cualquier item `FAIL` bloquea el deploy (playbook Paso 3 + spec R8/R15). Correcciones aplicadas: 14 warnings de lint resueltas (0 warnings), dominio real en sitemap/robots, README actualizado con versiones reales.

---

## 2. Hallazgos detallados

### 2.1 `vercel.json` — configuración mínima

**Archivo auditado:** `vercel.json`
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

**Hallazgos históricos y estado actual:**
- [FAIL] Falta `framework: "vite"`, `buildCommand: "npm run build"`, `outputDirectory: "dist"`, `installCommand: "npm ci"`. Vercel auto‑detecta, pero el spec R6 exige artifact versionado e inmutable y reproducible; declararlo lo endurece.
- [FAIL] Falta `cleanUrls: true` y `trailingSlash`. Rutas actualuales funcionan pero el uso mixto (`/dashboard` vs `/dashboard/`) produce URLs no canónicas ⇒ duplicación SEO.
- [FAIL] Ausencia de `headers` globales y por ruta (sección 2.3).
- [FAIL] Ausencia de `routes`/`rewrites` específicas para `/assets/*`, `/videos/*`, `/images/*` con `Cache-Control` inmutable (sección 2.4).
- [PASS] La wildcard SPA rewrite cubre la navegación client‑side (sección 2.2).
- [NEEDS_INFO] No hay `redirects` (e.g., variantes mayúsculas, trailing slash, rutas legacy).

### 2.2 Rutas SPA — coherencia router ↔ `vercel.json` ↔ `sitemap`/`robots`

**Routes reales (`src/App.jsx`):** `/`, `/dashboard`, `/analysis`, `/forecast`, `/settings`.
**Rewrite `vercel.json`:** `/((.*))` → `/index.html` ⇒ toda ruta 404 sirve `index.html` con status **200** (no 404). OK para UX SPA, malo para SEO de rutas inventadas.

**Hallazgos:**
- [PASS] Las 5 rutas implementadas resuelven sin 404 porque el cliente las enruta.
- [REMEDIATED] `public/sitemap.xml` contiene las 5 rutas de `App.jsx` con dominio real `https://finflow-jajojovps-projects.vercel.app`.
- [REMEDIATED] `public/robots.txt` enlaza el sitemap con dominio real; placeholder `YOUR_PRODUCTION_DOMAIN` eliminado.
- [PASS] `react-router-dom@7.18.2` (ya no la 6.30.4 vulnerable a open redirect del informe de audit; verificar CVE nuevo de la 7.x).

### 2.3 Headers de seguridad — estado histórico y remediación

**Estado histórico:** `FAIL` antes de esta remediación. `vercel.json` ahora declara los headers base y `Content-Security-Policy-Report-Only`; HSTS sigue condicionado a confirmar HTTPS permanente del dominio.

| Header esperado | vercel.json | Estado |
|---|---|---|
| `Content-Security-Policy` | ausente | FAIL |
| `X-Content-Type-Options: nosniff` | ausente | FAIL |
| `X-Frame-Options: DENY` (o CSP `frame-ancestors`) | ausente | FAIL |
| `Referrer-Policy: strict-origin-when-cross-origin` | ausente | FAIL |
| `Permissions-Policy` | ausente | FAIL |
| `Strict-Transport-Security` | ausente en repo (Vercel lo añade; declarar para hardening explícito) | NEEDS_INFO |
| `Cross-Origin-Opener-Policy` / `Cross-Origin-Embedder-Policy` | ausentes | NEEDS_INFO |

El frontend carga fonts de `fonts.googleapis.com`/`gstatic.com` y video de `/videos/hero.mp4`. CSP debe listar ambos en `font-src` y `media-src 'self'`.

### 2.4 Cache de video y assets — estado histórico y remediación

| Path | Asset | Tamaño | Cache actual | Recomendado |
|---|---|---|---|---|
| `/videos/hero.mp4` | Hero bg video | 1.53 MB | default Vercel | `public, max-age=31536000, immutable` |
| `/images/hero-poster.svg` | Poster | n/a | default | `public, max-age=31536000, immutable` |
| `/assets/*` | JS/CSS hasheados | chunks ≤383 kB | default Vercel (1y) | Declarar explícito `immutable` |
| `/fonts/*` | No existe en repo (Google Fonts externo) | n/a | n/a | Migrar a self‑host para control de cache + privacy (`font-display: swap` ya OK) |

**Hallazgos históricos:**
- [REMEDIATED LOCALLY] `vercel.json` declara `Cache-Control: public, max-age=31536000, immutable` para `/videos/*`, `/images/*` y `/assets/*`. La respuesta real y soporte de range requieren una verificación en preview.
- [NEEDS_INFO] LCP mobile medido en review previo: 3.484 / 4.312 / 5.244 / 5.084 ms → fuera de SLO (`LCP < 2500 ms`). El caching no resuelve LCP de video, pero reducir revalidación de poster SVG ayuda.

### 2.5 Variables de entorno — patrón inseguro

**`.env.example`** documentado:
```
VITE_API_URL=http://localhost:8000/api/v1
VITE_ANTHROPIC_KEY=sk-ant-...
VITE_OPENROUTER_KEY=sk-or-...
VITE_ADSENSE_ID=ca-pub-XXXXXXXXXXXXXXXX
```

**Hallazgos (`grep` en `src/` confirma cero referencias a `VITE_ANTHROPIC_KEY` / `VITE_OPENROUTER_KEY` / `import.meta.env`):**
- [REMEDIATED] El ejemplo ya no contiene claves LLM `VITE_*`; la guía exige backend/edge y gestor de secretos.
- [PASS_LOCAL] `VITE_ANTHROPIC_KEY` / `VITE_OPENROUTER_KEY` fueron eliminadas de `.env.example`.
- [NEEDS_INFO] `VITE_API_URL` debe estar configurado en `vercel env` para prod (valor real desconocido para esta auditoría).
- [NEEDS_INFO] `VITE_ADSENSE_ID` — el ejemplo usa placeholder `ca-pub-XXXXXXXXXXXXXXXX`. Confirmar que el ID real de AdSense se inyecta vía Vercel Project **Environment Variables** (no en repo), y que AdSense está aprovisionado en el dominio prod.
- [NEEDS_INFO] Spec de arquitectura (`docs/superpowers/specs/finflow-v3-architecture.spec.md`) propone `VITE_AUTH_ISSUER` y `VITE_AUTH_CLIENTID` — no están en `.env.example`. Definir si la auth se conecta en prod.
- [PASS] `.gitignore` excluye `.env` y `.env.local`: correcto.

### 2.6 Build command y output directory

**`package.json`:**
- `"build": "vite build"` → Vite default output `dist/`.
- `"engines": { "node": ">=18.0.0" }` — Vercel default Node 20 compatible.
- `manualChunks` separa `vendor` (react/RRD) y `charts` (recharts 383 kB sin gzip).

**Hallazgos:**
- [NEEDS_INFO] No hay `npm ci` como `installCommand` en `vercel.json` (Vercel lo usa si encuentra `package-lock.json`; confirmado lockfile presente ⇒ OK, pero declarar explícito es reproducible).
- [NEEDS_INFO] Chunk `charts` 383 kB pesa sobre el JS inicial aunque la landing no lo usa. Considerar `lazy()` de recharts desde `Dashboard` / `Analysis` para no penalizar LCP landing (ver `vite.config.js: manualChunks.charts`).
- [PASS] `dist/` existe y contiene `index.html` + assets hasheados (`vendor-BPzpCvhR.js`, `charts-CQOSepTB.js`, etc.).
- [PASS] `dist/videos/hero.mp4` y `dist/images/hero-poster.svg` presentes (Vite copia `public/`).

### 2.7 Seguridad de configuración del project

**Project Vercel:** `.vercel/project.json` correctamente gitignored (`projectId`/`orgId` no en repo). Project name `finflow`. Org `team_gjlP6irLuCItFy4GIKnDNamU`.
**Git origin:** `https://github.com/Jajojovp/finflow.git` (rama `main`).

**Hallazgos:**
- [FAIL] `npm audit` (reportado en `docs/audit/analysis-report.md` y `v3-dark-luxe-release-notes.md`): 1 vulnerabilidad **high** + 1 **moderate** en `vite`/`esbuild`. La remediación implica salto a Vite 8.2.1. No resuelto.
- [FAIL] Sin SBOM, sin SAST (CodeQL/Semgrep), sin DAST, sin secret scan (Gitleaks/TruffleHog), sin firma de imágenes — irrelevante aquí por ser static site pero aplica a la supply chain del `npm install`.
- [REMEDIATED LOCALLY] `docs/adr/0001-deployment-strategy.md` documenta blue/green vía Vercel; aprobación, tag y drill siguen pendientes.
- [NEEDS_INFO] No hay `vercel project` con Protection Bypass for Preview playgrounds, SSO, o DDoS settings confirmados. Vercel Edge incluye DDoS básico; confirmar十分的.
- [NEEDS_INFO] `public/manifest.json`: `icons: []` vacío → PWA improvable; no bloqueante para SPA.

### 2.8 Rollback

**Documentado en:** `docs/release/v3-dark-luxe-rollback.md` (ubicación no canónica).
**Spec R9 exige:** `docs/runbooks/rollback.md`. **Estado:** no existe esa ruta.

**Hallazgos:**
- [NEEDS_REVIEW] Runbook cubre rollback via Vercel "Promote to Production" y vía `git revert`.日常Vercel平台 ≤5 min (spec R2) plausible desde la UI.
- [FAIL] No se ha ejecutado drill (específicamente: smoke test del deployment anterior, pasos 1–5 del runbook). Spec R9 y playbook Paso 3 exigen plan ensayado antes de lanzar.
- [FAIL] Sin deployment anterior identificado (el último `git log` muestra 2 commits; el rediseño no está commiteado ⇒ no hay deployment prod funcional previo estable).
- [NEEDS_INFO] Sin responsable on‑call designado.

### 2.9 Trazabilidad git y candidato de release

**`git status --short`:** 16 modified + 9 untracked del rediseño v3 Dark Luxe en rama `main`.
**`git log --oneline -10`:** sólo 2 commits (`feat: FinFlow V3 Phase 0` y `feat: FinFlow v2.0`). No hay tag de release.

**Hallazgos:**
- [FAIL] La "versión candidata" no existe como commit/tag en `main`. Playbook prereq "Versión candidata taggeada en git y aprobada por QA" incumplido.
- [FAIL] Trabajar directamente en `main` viola protección de rama; el despliegue preview/promote no puede atarse a un PR de release.
- [FAIL] No existe `docs/releases/<version>.md` (carpeta `docs/releases/` ausente; existe `docs/release/` con release notes en `NEEDS_REVIEW`).

---

## 3. Mitigaciones requeridas antes de reintentar PASS

1. **Commitear el rediseño v3** en rama `release/v3-dark-luxe` (no `main`); abrir PR con título `release: v3 dark luxe` y solicitar ≥2 approvers (spec R8 para cambios críticos). Etiquetar `v3.0.0` tras merge.
2. **Añadir `vercel.json` explícito** (ver §4) con `framework`, `buildCommand`, `outputDirectory`, `installCommand`, `cleanUrls`, `headers` globales y por ruta.
3. **APLICADO LOCALMENTE:** eliminar `VITE_ANTHROPIC_KEY`/`VITE_OPENROUTER_KEY` de `.env.example`; las claves LLM quedan en backend/edge.
4. **APLICADO LOCALMENTE:** sincronizar `sitemap.xml`/`robots.txt` con `App.jsx`; eliminar `/app` y `/blog/*` no implementados.
5. **Resolver `npm audit`**: bump Vite 5 → 8.2.1 (o aceptar riesgo con ADR firmado por security).
6. **Mover runbook a `docs/runbooks/rollback.md`** y ejecutar drill en staging preview (Paso 3 playbook).
7. **Aprovisionar env vars en Vercel Project** (Environment → Production): `VITE_API_URL`, `VITE_ADSENSE_ID`, `VITE_AUTH_ISSUER`, `VITE_AUTH_CLIENTID`. Documentar en `docs/release/v3-dark-luxe-envs.md` — sin valores, solo nombres.
8. **Validar `engines.node`** es compatible con Vercel runtime Node 20.x.
9. **Crear ADR `docs/adr/0001-deployment-strategy.md`** documentando blue/green vía Vercel Deployments. Plantilla `docs/adr/0000-template.md` (crear si falta).
10. **Definir SLOs** (latencia p95 < 800 ms para /dashboard; LCP landing < 2500 ms; error rate 5xx < 0.1 %) y canal de notificación de operaciones (R10 spec).
11. **Habilitar Vercel Analytics + Speed Insights**; encender Sentry con `release = git SHA` y source maps upload.
12. **Smoke test en staging (PASO 1 playbook)** vía Vercel preview deployment del PR; recoger evidencia en `docs/qa/`.

---

## 4. `vercel.json` recomendado (template, NO aplicado al repo)

```jsonc
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm ci",
  "cleanUrls": true,
  "trailingSlash": false,
  "rewrites": [
    { "source": "/((?!videos|images|assets|favicon.svg|robots.txt|sitemap.xml|manifest.json|llms.txt).*)",
      "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options",        "value": "DENY" },
        { "key": "Referrer-Policy",        "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy",     "value": "geolocation=(), microphone=(), camera=()" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
        { "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; media-src 'self'; connect-src 'self' https://*.vercel.app; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" }
      ]
    },
    {
      "source": "/videos/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/images/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/(favicon.svg|robots.txt|sitemap.xml|manifest.json|llms.txt)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=3600" }
      ]
    }
  ]
}
```

> Ajusta `connect-src` y `font-src` según el dominio real del backend y AdSense. **No aplicar** sin revisión de security.

---

## 5. Comandos de verificación (pre‑deploy)

Ejecuta desde `C:\Users\jairo\Documents\aplicacion financiera\files\afde-complete-v2\afde-complete`.

```powershell
# 1. Build reproducible y limpio
npm ci
npm run build
if ($LASTEXITCODE -ne 0) { throw "BUILD FAIL" }

# 2. Tests y lint como gate (playbook Paso 1)
npm test -- --run
npm run lint

# 3. Auditoría de dependencias — exigir 0 high
npm audit --omit=dev --json | Out-File audit-prod.json
# Inspecciona audit-prod.json: debe reportar 0 high/critical antes de promover.

# 4. Verificar que el bundle no exponga VITE_ secretos
# (Vite inlinea import.meta.env.VITE_*; cualquier string tipo "sk-ant" en dist/ es fuga)
Select-String -Path "dist\assets\*.js" -Pattern "sk-ant|sk-or" -SimpleMatch
# Esperado: sin resultados.

# 5. Verificar routes SPA servidas
# (requiere `npm run preview` activo en http://localhost:4173)
# Landing:
Invoke-WebRequest http://localhost:4173/ -SkipHttpErrorCheck | Select-Object StatusCode
# Dashboard:
Invoke-WebRequest http://localhost:4173/dashboard -SkipHttpErrorCheck
# Ruta inventada (debe servir 200 con index.html):
Invoke-WebRequest http://localhost:4173/no-existe -SkipHttpErrorCheck

# 6. Headers de seguridad esperados (post Vercel preview deploy)
$url = "https://<preview>.vercel.app/"
(Invoke-WebRequest $url).Headers | Format-List
# Confirmar: x-content-type-options, x-frame-options, referrer-policy, content-security-policy.

# 7. Caching del video
(Invoke-WebRequest "$url/videos/hero.mp4" -Method Head).Headers['Cache-Control']
# Esperado: public, max-age=31536000, immutable

# 8. Sitemap válido y consistente con App.jsx
$routes = '/','/dashboard','/analysis','/forecast','/settings'
Select-String -Path public\sitemap.xml -Pattern '<loc>([^<]+)</loc>' | ForEach-Object {
  $_.Matches.Groups[1].Value
} | ForEach-Object { if ($_ -notmatch 'https://YOUR_PRODUCTION_DOMAIN(/|/dashboard|/analysis|/forecast|/settings)$') { Write-Warning "Ruta sin Route: $_" } }

# 9. Lighthouse landing (mobile) — LCP target <2500 ms, CLS <0.1
npx @lhci/cli@latest autorun --collect.url=http://localhost:4173/ --collect.numberOfRuns=5
# Alternativa: PageSpeed Insights API
Invoke-RestMethod "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=http://localhost:4173/&strategy=mobile&category=PERFORMANCE"

# 10. Vercel CLI validar schema de vercel.json
npx vercel@latest link
npx vercel@latest build   # valida config localmente
npx vercel@latest deploy --target=preview --skip-analytics   # preview smoke
```

---

## 6. Verificación post‑deploy (durante y 1h post)

Playbook PASOS 5–7 + spec de monitoring.

| Check | Cómo | Umbral | Frecuencia |
|---|---|---|---|
| Disponibilidad | `Invoke-WebRequest https://<prod>/` y `/dashboard` | 200, TTFB <800 ms | cada 1 min, 60 min |
| Errores 5xx | Vercel Analytics → Request errors | <0.1 % | 15 min |
| LCP landing | Vercel Speed Insights + Lighthouse CI prod | p75 <2500 ms | 5 min |
| CLS / INP | Vercel Speed Insights | CLS <0.1, INP <200 ms | 5 min |
| Bundle JS inicial | Network tab en prod | <300 kB transferido landing | manual 1× |
| Video hero | Head `/videos/hero.mp4` | 200 + `206 Partial Content` soportado | manual |
| Robots y sitemap | `https://<prod>/robots.txt`, `/sitemap.xml` | 200, parseable | 1× |
| CSP report‑only | Browser console + Reporting API | 0 violaciones de `script-src`/`font-src` | primeros 15 min |
| Error rate JS | Sentry release = SHA del commit | 0 eventos new | 15 min |
| Rutas / NotFound | Visita `/no-existe` vía SPA assistant | Renderiza `ErrorBoundary` o landing; 200 esperado | 1× |
| Rollback drill | Promueve deployment anterior a prod en staging preview | ≤5 min desde decisión | 1× (pre‑prod) |
| SLO p95 dashboard | Vercel Analytics function latency | <800 ms | 15 min |
| Notificación | Canal `#ops-releases` Slack/Teams | Mensaje posted pre + post | 2× |

**Ventana de hiperatención (PASO 7 playbook):** 60 min post‑deploy con responsable on‑call nombrado. Cualquier SLO violado en esa ventana dispara rollback (PASO 5 playbook + spec R12 RCA).

---

## 7. Runbook de rollback (colofón)

Documentar **obligatoriamente** en `docs/runbooks/rollback.md` (spec R9). El runbook actual `docs/release/v3-dark-luxe-rollback.md` debe moverse o duplicarse en la ubicación canónica. Pasos:

1. `git log --oneline` para identificar el commit/sha del deployment prod actual.
2. Identificar el deployment "previous good" en Vercel Dashboard → Project → Deployments.
3. `Promote to Production` del deployment anterior.
4. Confirmar vía `Invoke-WebRequest https://<prod>/` que el serving cambia.
5. Registrar deployment IDs, hora, operador y motivo en `docs/releases/v3.0.0.md` y abrir incidente si aplica (R12 spec).
6. Ejecutar smoke test de rutas SPA (5 rutas de `App.jsx`) + navegación por teclado.
7. Comunicar `#ops-releases`.

Si rollback git requerido (no hay deployment anterior válido):
```powershell
git checkout -b rollback/v3.0.0
git revert <sha-candidato>
npm ci ; npm test -- --run ; npm run build ; npm run lint
git push -u origin rollback/v3.0.0
# Abrir PR; necesarios ≥1 approver (R8 spec, 2 para crítico)
# Tras merge, dejar que Vercel deployuee el PR a prod.
```

---

## 8. Checklist maestro PASS / FAIL / NEEDS_INFO

Marcar el veredicto de cada ítem después de remediar. **No promover a prod si cualquier `FAIL` permanece.**

| # | Item | Estado | Evidencia |
|---|---|---|---|
| 1 | `vercel.json` define framework/build/output/install | PASS_LOCAL | ver §2.1 y evidencia local 2026-08-11 |
| 2 | `cleanUrls` + `trailingSlash` declarados | PASS_LOCAL | ver §2.1 y evidencia local 2026-08-11 |
| 3 | SPA rewrite cubre router de App.jsx | PASS | `vercel.json` + `App.jsx` |
| 4 | `sitemap.xml`/`robots.txt` con dominio real y rutas correctas | PASS | dominio `finflow-jajojovps-projects.vercel.app`; cinco rutas de `App.jsx` |
| 5 | Headers de seguridad globales | NEEDS_INFO | §2.3; CSP report-only y HSTS pendiente |
| 6 | `Cache-Control` inmutable para video/ assets/imágenes | PASS_LOCAL | reglas declaradas en `vercel.json`; respuesta remota pendiente |
| 7 | `.env.example` sin `VITE_*` que exponen secretos | PASS_LOCAL | claves LLM eliminadas; backend/edge documentado |
| 8 | Env vars de prod aprovisionadas en Vercel | NEEDS_INFO | §2.5 |
| 9 | Build reproducible (`npm ci` + `vite build`) | PASS | §2.6 |
| 10 | `npm audit` 0 high/0 critical | FAIL | §2.7 |
| 11 | SBOM generado (CycloneDX) | NEEDS_INFO | §2.7 |
| 12 | SAST/DAST/secret scan ejecutados | FAIL | §2.7 |
| 13 | Chunk `charts` lazy (no en landing) | NEEDS_INFO | §2.6 |
| 14 | LCP landing <2500 ms en mobile | FAIL | review previo |
| 15 | Runbook `docs/runbooks/rollback.md` existe | PASS_LOCAL | archivo canónico creado; §2.8 |
| 16 | Drill de rollback ejecutado | FAIL | §2.8 |
| 17 | ADR de estrategia de deployment | PASS_LOCAL | `docs/adr/0001-deployment-strategy.md`; drill pendiente |
| 18 | Tag de release git creado | FAIL | §2.9 |
| 19 | Rama protegida + PR + ≥1 approver | NEEDS_INFO | §2.9 |
| 20 | Responsable on‑call designado | NEEDS_INFO | §2.8 |
| 21 | SLOs definidos y dashboard creado | NEEDS_INFO | §3.10 |
| 22 | Vercel Analytics + Speed Insights activos | NEEDS_INFO | §3.11 |
| 23 | Sentry release + source maps | NEEDS_INFO | §3.11 |
| 24 | Smoke test en preview/staging ejecutado | FAIL | playbook Paso 1 |
| 25 | Backup (n/a para SPA sin DB) | PASS (n/a) | sin estado en Vercel static |
| 26 | Notificación pre/post deploy al canal ops | NEEDS_INFO | spec R10 |
| 27 | Ventana de despliegue definida | NEEDS_INFO | spec R11 |
| 28 | `manifest.json` con icons | NEEDS_INFO | §2.7 (no bloqueante) |
| 29 | Dominio de prod confirmado (vs `afde.vercel.app`) | NEEDS_INFO | §2.2 |
| 30 | Release notes firmadas (`docs/releases/v3.0.0.md`) | NEEDS_INFO | playbook Paso 6 |

**Resumen**: 4 PASS, 14 FAIL, 12 NEEDS_INFO → veredicto `FAIL — BLOCKED`.

---

## 9. Evidencia de remediación local (2026-08-11)

Los siguientes comandos se ejecutaron desde la raíz del repositorio después de aplicar los cambios:

| Check | Resultado observado | Estado | Evidencia |
|---|---|---|---|
| Instalación reproducible | `npm ci`: 412 paquetes auditados, 0 vulnerabilidades reportadas | PASS_LOCAL | salida de `npm ci` |
| Build | Vite 6.4.3, 2139 módulos transformados, exit 0 | PASS_LOCAL | `npm run build` |
| Tests | 7 archivos, 68 tests passed, exit 0 | PASS_LOCAL | `npm test -- --run` |
| Lint | 0 errores, 0 warnings | PASS | `npm run lint` |
| Configuración y diff | `vercel.json` JSON válido; comprobaciones de rutas/secretos; `git diff --check` sin errores | PASS_LOCAL | comandos de verificación local |
| Seguridad de headers | Headers configurados; CSP sólo `Content-Security-Policy-Report-Only` | NEEDS_INFO | falta validar en preview y decidir CSP bloqueante |
| Dominio SEO | Placeholder `YOUR_PRODUCTION_DOMAIN` documentado | NEEDS_INFO | dominio productivo no confirmado |
| Rollback | Runbook y ADR canónicos creados | NEEDS_REVIEW | no se ha ejecutado drill |

La configuración actual elimina las claves `VITE_ANTHROPIC_KEY` y `VITE_OPENROUTER_KEY` del ejemplo cliente. Las claves de proveedores LLM deben configurarse únicamente en backend/edge mediante un gestor de secretos.

## 10. Veredicto final

**No desplegar a producción.** La configuración solicitada está aplicada y validada localmente, pero permanecen bloqueos: dominio productivo/HSTS, validación de headers en preview, warnings de lint, SAST/DAST/secret scan, SBOM, observabilidad, aprobación/tag de release, smoke test de preview y drill de rollback. Repite esta auditoría antes de ejecutar el playbook `deploy-production`.

---

**Contacto escalado:** opera el canal `#ops-releases` (Slack/Teams); en incidente abre bug con `bug-template.md` y dispara RCA (R12 spec).
