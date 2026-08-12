# FinFlow v3 — Mapeo OWASP Top 10 (2021)

- **Fecha:** 2026-08-11
- **Spec de referencia:** `09-security/owasp.spec.md` R1 (publicar mapeo A01–A08 + A09/A10 con control existente o pendiente).
- **Tipo de app:** SPA estática (Vite + React 18) servida por Vercel. **Sin** backend propio, **sin** auth propia, **sin** base de datos en el repo.

## Mapeo

| Ref | Categoría OWASP 2021 | Aplica a FinFlow | Control existente | Estado |
|---|---|---|---|---|
| A01 | Broken Access Control | No en la SPA actual (no hay auth, no hay IDs, no hay endpoints server-side propios). | N/A | N/A — re-evaluar al introducir cuentas/API. |
| A02 | Cryptographic Failures | Sí — manejo de claves LLM con prefijo `VITE_` (H-04). | Ninguno | `OPEN` (H-04). |
| A03 | Injection | No (sin entrada de datos server-side). | N/A | N/A. |
| A04 | Insecure Design | Sí — falta threat model STRIDE. | Ninguno | `OPEN` (H-05). |
| A05 | Security Misconfiguration | Sí — ausencia de headers/CSP (H-03). | Ninguno | `OPEN` (H-03). |
| A06 | Vulnerable & Outdated Components | Sí — vite/esbuild vulnerables. | `npm audit` manual | `REMEDIADO` (H-01, H-02). |
| A07 | Identification & Auth Failures | No (sin auth en la SPA). | N/A | N/A. |
| A08 | Software & Data Integrity Failures | Sí — sin SBOM, sin SAST/SAST en CI. | Ninguno | `OPEN` (H-05). |
| A09 | Security Logging & Monitoring | No aplica a SPA estática pura. | N/A | Pendiente cuando exista backend. |
| A10 | Server-Side Request Forgery | No (sin fetch de URLs user-controlled del lado server). | N/A | N/A. |

## Ventanas de remediación aplicadas (owasp.spec R13)

- Critical: 7 días — (ninguno abierto).
- High: 30 días — H-01 **remediado misma sesión** (dentro de ventana).
- Medium: 90 días — H-02 remediado; H-03, H-04, H-05 **abiertos**, plazo objetivo 2026-11-09.
- Low: próximo release — (ninguno).

## Pruebas requeridas pendientes (según owasp.spec R3, R6, R7)

- SCA automatizado en cada build (R6): **pendiente**.
- SAST en cada build (R6): **pendiente** (semgrep no instalado).
- SBOM CycloneDX por release (security.spec R7 / owasp.spec R8): **pendiente**.
- Reporte con PoC por hallazgo (R12): H-01 y H-02 documentados con advisory + path + versión; H-03/H-04/H-05 con evidencia de config y recomendación.

## Cierre del mapeo

El mapeo queda ** publicado en reposo** (cumple R1 en lo formal). Persisten controles “pendientes” (H-03, H-04, H-05); por tanto **no se afirma cumplimiento OWASP** hasta cerrarlos y ejecutar las pruebas activas que apliquen cuando exista backend.