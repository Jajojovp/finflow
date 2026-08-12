# FinFlow v3 Dark Luxe - Security Scope

**Audiencia:** seguridad, ingenieria y Quality Reviewer  
**Tipo:** alcance de revision pasiva  
**Estado:** `REMEDIATION_APPLIED` — riesgo `high` de supply chain cerrado; pendientes decision sobre H-03/H-04/H-05. **NO declarar produccion segura.**

## Alcance

Revisa pasivamente los cambios de la landing, sus dependencias, metadata, asset de video, rutas publicas y configuracion visible del repositorio. Cubre inventario de dependencias, secretos accidentalmente versionados, headers declarados, riesgos OWASP relevantes para una SPA estatica y separacion entre demo y datos financieros reales.

## Limites

No se ejecutan pentest, DAST, fuzzing, explotacion activa, pruebas contra produccion, verificacion de IAM/MFA, validacion de TLS en staging, SBOM firmada, logs inmutables, SAST automatizado, ni auditoria legal. No hay afirmacion de cumplimiento OWASP, ISO, PCI, GDPR o CCPA.

## Evidencia ejecutada (2026-08-11)

- `npm audit --json` ANTES: 1 `high` en Vite (GHSA-fx2h-pf6j-xcff, CVSS 7.5) + 1 `moderate` en esbuild (GHSA-67mh-4wv8-2f99, CVSS 5.3). Evidencia en `docs/security/evidence/npm-audit-BEFORE-upgrade.json`.
- Upgrade aplicado **no-breaking**: `vite ^5.1.0 -> ^6.4.3` (instalado `vite@6.4.3`, arrastra `esbuild@0.25.12`, fuera del rango vulnerable `<=0.24.2`). No fue necesario tocar `@vitejs/plugin-react@4.7.0` (admite Vite 6) ni `vitest@3.2.7`.
- `npm audit --json` DESPUES: 0 critical / 0 high / 0 moderate / 0 low. Evidencia en `docs/security/evidence/npm-audit-AFTER-upgrade.json`.
- `npm run build`: OK (2139 modulos, 24.13s). `npm test`: 68/68 pass. `npm run lint`: 0 errores (14 warnings preexistentes).
- Secret scanning manual en working tree: 0 hits reales. Coincidencias solo en `.env.example` (placeholders) y docs (menciones conceptuales).
- No se genero SBOM (`cdxgen` no instalado). No se ejecuto SAST (`semgrep`/`gitleaks` no instalados). Headers/CSP no verificados en staging.

## Hallazgos abiertos (ver `2026-08-11-production-readiness-audit.md`)

- **H-03** (Medium, A05): headers de seguridad ausentes en `index.html` y `vercel.json`. Diff propuesto en el reporte; requiere validacion en staging.
- **H-04** (Medium, A02/A05): `.env.example` define `VITE_ANTHROPIC_KEY`/`VITE_OPENROUTER_KEY`; cualquier `VITE_*` queda expuesta en el bundle del cliente. Migrar a backend/edge con gestor de secretos.
- **H-05** (Medium, A08): sin SBOM por release, sin SAST/SCA en CI, sin threat model STRIDE publicado.

## Riesgos abiertos

1. H-03, H-04 y H-05 bloquean la declaracion formal de release seguro.
2. Reauditoria requerida tras cerrar H-03/H-04/H-05.
3. Validacion de TLS/HSTS en staging fuera del scope pasivo actual.
4. Claims de AI y precision del copy requieren validacion de producto; no tratar el prototipo como sistema financiero de produccion.

## Criterio para cerrar

Aplicar headers/CSP validados, publicar SBOM, automatizar SCA/SAST en CI, completar threat model STRIDE y migrar claves LLM a edge function. Reauditar y entonces evaluar declaracion de produccion.