# FinFlow v3 Dark Luxe - Test Plan

**Audiencia:** QA e ingenieria  
**Estado:** `NEEDS_REVIEW`.
**Correcciones registradas:** H-1 (Escape y restauracion de foco del menu mobile) y H-3 (poster y `preload="none"` en mobile para proteger LCP) aplicadas; este documento no convierte esos casos en PASS sin evidencia nueva.

## Entorno

Usa Node `>=18`, npm, dependencias instaladas y un preview/staging de Vercel. Registra commit, navegador, viewport, sistema operativo, fecha y URL. Los comandos locales no sustituyen staging.

## Suite automatizada

| Area | Comando o tecnica | Criterio |
|---|---|---|
| Unit | `npm test -- --run` | 0 fallos; reportar cobertura separada |
| Build | `npm run build` | Exit code 0 y artefactos generados |
| Lint | `npm run lint` | 0 errores; clasificar y reducir warnings a11y |
| E2E | Playwright en preview/staging | Navegacion y CTAs sin errores |
| Performance | Lighthouse/Web Vitals y prueba repetida | Reportar LCP, INP, CLS, peso y SLO acordado |
| Seguridad | SAST, SCA, DAST autorizado, secret scan | Sin bloqueantes; adjuntar salida real |

## Responsive

Ejecuta la landing en 375, 768, 1024 y 1440 px. Comprueba overflow horizontal, nav mobile, orden de contenido, legibilidad del hero, targets tactiles de al menos 44 px, video, footer y anchors `#features` y `#how-it-works`.

## Teclado y accesibilidad

1. Navega con Tab y Shift+Tab sin trampas de foco.
2. Confirma foco visible en links, botones y menu mobile.
3. Activa y cierra el menu mobile con teclado y Escape si aplica.
4. Verifica nombres accesibles, headings, landmarks y orden de lectura con lector de pantalla.
5. Mide contraste WCAG 2.2 AA en contenido estatico y frames del video.

## Reduced motion y video

Activa `prefers-reduced-motion: reduce`. Comprueba que animaciones no esenciales se desactivan o sustituyen, que el video no impide leer ni usar la pagina y que autoplay, poster/fallback, pausa/error y descarga mobile tienen comportamiento documentado.

## Rutas y anchors

Verifica `/`, `/dashboard`, `/analysis`, `/forecast` y `/settings`. Desde la landing verifica los CTAs `/dashboard`, `/forecast`, `#features` y `#how-it-works`. Registra cualquier 404, ruta vacia, refresh directo fallido o anchor que no lleve al heading correspondiente.

## Estado conocido

La ejecucion del 2026-08-11 registra build exit 0, 68 tests en 7 archivos, lint con 0 errores y 14 warnings existentes, `git diff --check` limpio y harness Chromium local. H-1 queda validado en ese harness; H-3 mejora la estrategia pero conserva LCP sobre 2.5 s (3484/4312/5244/5084 ms), por lo que no se declara PASS de LCP ni de staging.
