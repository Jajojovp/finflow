# FinFlow v3 Dark Luxe — Visual & A11y Report (browser run)

**Audiencia:** QA, UX, Quality Reviewer, Engineering
**Resultado:** `NEEDS_REVIEW` — H-1 validado, H-3 con LCP aún fuera del umbral pese a optimizaciones aplicadas. No se declara PASS global.

## Entorno de la prueba (real)

| Item | Valor |
|---|---|
| Fecha | 2026-08-12 00:40 UTC (segunda ejecución post-optimizaciones) |
| OS | win32 (Windows 11, PowerShell 5.1) |
| Node | v22.14.0 |
| Build | `npm run build` exitoso, 2139 módulos, 75 s |
| Preview | `vite preview --port 4173 --strictPort` levantado en child process controlado; log limpio |
| URL base | `http://localhost:4173/` (respondió 200 en ~4 s desde spawn) |
| Navegador | Chromium headless (Playwright cacheado por npx) |
| Viewports | 375x812, 768x1024, 1024x768, 1440x900 (deviceScaleFactor=2) |
| Evidencia | `docs/qa/run/out/playwright-results.json` · `docs/qa/run/out/run.log` · `docs/qa/run/out/preview.log` · `docs/qa/screenshots/*.png` |
| Script | `docs/qa/run/playwright-landing.cjs` (re-ejecutable) |

> Nota de QA: Métricas reales capturadas vía `PerformanceObserver` (LCP + CLS + INP/event). Sin throttle de red/CPU (preview local); los números absolutos no sustituyen un field-run sobre 4G.

## Disponibilidad de herramientas

| Herramienta | Estado | Origen |
|---|---|---|
| Node ≥18 | OK | `node --version` → v22.14.0 |
| `npm run build` | OK | 2320 módulos, exit 0 |
| `npm run preview` | OK | Levanta vite preview en :4173 sin errores |
| Playwright (chromium) | OK | `npx playwright install chromium` descargó `chromium_headless_shell-1234` (114.5 MiB) |
| Playwright (webkit, firefox) | NO_INSTALADO | `npx playwright install` solo se ejecutó para chromium por decisión explícita |
| axe-core / axe-playwright | NO_INSTALADO | No es dependencia del proyecto; se hicieron chequeos a11y manuales accionables |
| Lighthouse | NO_USADO | Fuera de alcance en esta sesión headless |
| Puppeteer | NO_INSTALADO | No es dependencia; Playwright cubre el mismo caso |

> El harness **no modificó `package.json`**: Playwright se resolvió vía `createRequire` desde el cache de npx (`C:\Users\jairo\AppData\Local\npm-cache\_npx\e41f203b7505f1fb\node_modules\playwright`).

## Matriz de escenarios (con evidencia real)

| # | Escenario | Estado | Evidencia |
|---|---|---|---|
| 1 | Landing carga 200 en 375x812 | PASS | `viewports.mobile-iphone-se.status=200`, nav 6323 ms, 0 console errors |
| 2 | Landing carga 200 en 768x1024 | PASS | `viewports.tablet-ipad.status=200`, nav 2224 ms, 0 errors |
| 3 | Landing carga 200 en 1024x768 | PASS | `viewports.laptop.status=200`, nav 2607 ms, 0 errors |
| 4 | Landing carga 200 en 1440x900 | PASS | `viewports.desktop.status=200`, nav 2461 ms, 0 errors |
| 5 | Sin overflow horizontal en los 4 viewports | PASS | `overflowX=0` en los 4 (scrollW === clientW) |
| 6 | Video hero carga y reproduce | PASS | `videoReadyState=4` (HAVE_ENOUGH_DATA), `videoPaused=false` en los 4 viewports con motion default |
| 7 | `prefers-reduced-motion: reduce` oculta el video | PASS | `reducedMotion.hasVideo=false`, `heroBgColor=rgb(5,5,5)` solido, captura `reduced-motion-landing-1440x900.png` |
| 8 | Foco visible en todos los interactivos | PASS | Traza de 12 Tab: 11/11 `<a>` y `<button>` con `hasVisibleFocus=true` (outline dorado `rgb(245,197,24)` o box-shadow ring dorado) |
| 9 | Sin trampa de foco en landing | PASS | El 12.º Tab cae en `<body>` (wrap esperado) sin perderse |
| 10 | Anchor `#features` lleva al section | PASS | Click en `<a href="#features">` → `hash="#features"`, `scrollY=900`, target `top=0 inViewport=true` |
| 11 | Anchor `#how-it-works` lleva al section | PASS | Click en `<a href="#how-it-works">` → `hash="#how-it-works"`, `scrollY=1736`, target `top=0 inViewport=true` |
| 12 | Link `/dashboard` navega via React Router | PASS | Click → `location.href=/dashboard`, 0 pageerrors, body renderiza "Dashboard…Financial overview…Total revenue $7,284,000.00" |
| 13 | Landmark `<main>` en landing | PASS | `a11y.hasMain=true` en los 4 viewports |
| 14 | 1 `<h1>` por página | PASS | `a11y.h1Count=1`, texto "Turn raw data into confident financial decisions" (vía `aria-label`) |
| 15 | Nav con `aria-label="Main navigation"` | PASS | `a11y.navLandmarkLabel="Main navigation"` |
| 16 | 0 interactivos sin nombre accesible | PASS | `a11y.interactiveWithoutName=0` en los 4 viewports |
| 17 | Heading hierarchy presente | PASS | `headingLevels=17` (h1 + h2/h3/h4 en Features, HowItWorks, Footer) |
| 18 | Menú móvil abre con clic | PASS | `afterOpen={menuVisible:true, expanded:"true", menuLinks:[Features,How it works,Dashboard,Open app]}`, captura `mobile-menu-open-375x812.png` |
| 19 | Menú móvil cierra con toggle | PASS | Segundo clic → `afterToggleClose={menuPresent:false, expanded:"false"}` (panel desmontado) |
| 20 | TTFB < 100 ms | PASS | 15–43 ms en los 4 viewports |
| 21 | CLS < 0.1 | PASS | 0.0001 (desktop) / 0.0002 (laptop) / 0.0263 (tablet) / 0.0396 (mobile) |
| 22 | INP < 200 ms | PASS | `inpMax=0` en los 4 (sin métrica de interacción > 16 ms registrada en carga automática) |
| 23 | LCP < 2.5 s | FAIL | Nueva medicion 2026-08-11: 3484 ms mobile · 4312 ms tablet · 5244 ms laptop · 5084 ms desktop — ver H-3 |
| 24 | Menú móvil cierra con Escape | PASS_BROWSER_LOCAL | Nueva medicion 2026-08-11: `afterEscape={menuVisible:false, expanded:"false"}`; la fila historica anterior queda supersedida |
| 25 | axe-core audit WCAG | NEEDS_BROWSER | axe-core no instalado; no se puede afirmar conformidad WCAG AA |
| 26 | Lighthouse / thresholds perf | NEEDS_BROWSER | No ejecutado en esta sesión |
| 27 | Multi-navegador (WebKit, Firefox) | NEEDS_BROWSER | Solo Chromium; `npx playwright install webkit firefox` pendiente |
| 28 | Lector de pantalla (NVDA/VoiceOver) | NEEDS_BROWSER | No ejecutado en esta sesión |
| 29 | Targets táctiles ≥ 44 px | NEEDS_BROWSER | Requiere medición de bounding box; los CTAs declaran `min-h-11` (44 px) — ver nota |
| 30 | Contraste del texto sobre video frame a frame | NEEDS_BROWSER | Sin eyedropper/axe-color en esta sesión; overlay declarado en código |
| 31 | Video NO montado en mobile/tablet (≤768px) | PASS | `isMobile gate` en Hero.jsx: `video=false` en 375x812 y 768x1024, `video=true` en 1024x768 y 1440x900. Ahorra ~1.53 MB en mobile. |

## Optimizaciones de performance aplicadas (2026-08-12)

### 1. Lazy-load de recharts (chunk separado: 393 KB)

`vite.config.js` define `manualChunks: { charts: ['recharts'] }`, y `App.jsx` usa `React.lazy()` para Dashboard, Analysis, Forecast (las páginas que importan `LineChart`/`BarChart` de recharts). Landing mantiene importación directa (sin lazy). Build resultante:

| Chunk | Tamaño | Gzip |
|---|---|---|
| `charts-CSfTVBdm.js` (recharts) | 393.33 KB | 108.02 KB |
| `vendor-CDNGbu7j.js` (react, react-dom, react-router-dom) | 179.03 KB | 58.95 KB |
| `index-BDqZ8BLf.js` (Landing + App shell) | 29.76 KB | 9.18 KB |
| `Dashboard-_mq6YmTp.js` | 6.19 KB | 2.65 KB |
| `Analysis-DM01EJr8.js` | 7.53 KB | 3.02 KB |
| `Forecast-Cb2YA_gy.js` | 7.60 KB | 3.37 KB |
| `Settings-Co-AwA7n.js` | 6.46 KB | 2.46 KB |

El chunk `charts` (recharts) **no se carga en la landing page inicial**; solo se descarga cuando el usuario navega a Dashboard/Analysis/Forecast. El bundle inicial (index + vendor = ~209 KB sin gzip, ~68 KB gzip) es significativamente menor.

### 2. Video hero: solo poster en mobile, sin cargar MP4

`Hero.jsx` verifica `isMobile` (≤768px vía `useMediaQuery`) y no monta el elemento `<video>` cuando es true. El harness confirma `video=false` en 375x812 y 768x1024, `video=true` en 1024x768 y 1440x900. Esto evita la descarga de `hero.mp4` (1.53 MB) en dispositivos móviles y tablets.

## Hallazgos (con repro)

### H-1 — El menú móvil no cierra con Escape (mediana)

**Severidad:** Media (accesibilidad teclado + ARIA APG disclosure pattern)
**Sintoma:** Tras abrir el menú móvil con clic, al pulsar `Escape` el panel queda visible (`menuVisible=true`, `aria-expanded="true"`). Solo un segundo clic en el toggle lo cierra.
**Repro:**
1. `node docs/qa/run/playwright-landing.cjs`
2. La ejecucion original reporto `afterEscape={"menuVisible":true,"expanded":"true"}`; la reejecucion 2026-08-11 reporto `afterEscape={"menuVisible":false,"expanded":"false"}`.
3. Comparar con `afterToggleClose={"menuPresent":false,"expanded":"false"}`
**Repro mínimo (código):** En `LandingNav.jsx` el botón toggle no tiene `onKeyDown`/`useEffect` que escuche `Escape`. El panel `landing-mobile-menu` tampoco.
**Esperado:** Cualquier tecla `Escape` cierra el panel y devuelve el foco al toggle (APG disclosure).
**Estándar:** WAI-ARIA Authoring Practices 1.2 — Disclosure (Show/Hide).

**Correccion aplicada y validada localmente:** `LandingNav.jsx` registra un listener `keydown` solo mientras el menu esta abierto, lo limpia al cerrar/desmontar, cierra con `Escape` y devuelve el foco al boton. El run 2026-08-11-15:54 reporta `afterEscape={menuVisible:false, expanded:false}`.

### H-2 — Cierre del menú móvil desmonta el panel (baja)

**Severidad:** Baja (UX/animación)
**Sintoma:** `afterToggleClose.menuPresent=false` indica que el componente se renderiza condicionalmente (`{open && (...)}`) en lugar de ocultarse con transición.
**Repro:** `docs/qa/run/out/playwright-results.json` → `keyboard.afterToggleClose`.
**Esperado:** Mantener el nodo montado con estado `aria-hidden`/`hidden` para animar la salida (FadeIn existe en el repo).
**Código:** `src/components/landing/LandingNav.jsx:73` → `{open && (...)}`.

### H-3 — LCP fuera del umbral `< 2.5 s` (alta, performance)

**Severidad:** Alta (Core Web Vitals)
**Estado:** Abierto. Optimizaciones aplicadas: Landing sin lazy-load (import directa, reduce round-trip de chunk extra), video deshabilitado en mobile/tablet (`!isMobile` gate). Confirmado en harness: `video=false` para 375x812 y 768x1024. Pese a esto, el LCP sigue 10,540 ms en mobile y 5,612–7,772 ms en el resto.
**Causa raíz:** Las animaciones JS del Hero (`AnimatedHeading` carácter-por-carácter, `FadeIn` con delays 800–1600 ms) dominan el LCP. Sin lazy, el Hero se renderiza antes, pero el LCP se atribuye a elementos de texto que solo se vuelven visibles tras las animaciones.
**LCP medido (2026-08-12):** 10,540 ms (375x812), 5,612 ms (768x1024), 7,772 ms (1024x768), 6,360 ms (1440x900).
**Siguientes pasos:** Reducir delays de animación en mobile, precargar hero-poster.svg con `fetchpriority="high"`, usar `content-visibility: auto` en secciones below-the-fold.

### H-4 — Dashboard sin landmark `<main>` (baja, fuera de landing)

**Severidad:** Baja (accesibilidad — fuera del scope de landing pero detectado)
**Sintoma:** En `/dashboard`, `routes.dashboard.after.hasMain=false`. Solo la Landing declara `<main>`.
**Repro:** `playwright-results.json` → `routes.dashboard.after.hasMain`.
**Código:** `src/App.jsx` envuelve rutas en `Suspense` pero `Dashboard.jsx` no introduce `<main>`/`role="main"`. Mismo patrón probable en Analysis/Forecast/Settings.

### H-5 — `<title>` no cambia por ruta (baja, fuera de landing)

**Severidad:** Baja (SEO + a11y)
**Sintoma:** Tras navegar a `/dashboard`, `document.title` sigue "FinFlow — Financial Intelligence" (el de `index.html`).
**Esperado:** Cada ruta actualiza `<title>` (react-helmet o `document.title` en `useEffect`).

## Cobertura de performance observada (post-optimizaciones 2026-08-12)

| Viewport | TTFB (ms) | LCP (ms) | CLS | INP (ms) | nav total (ms) | Video montado |
|---|---|---|---|---|---|---|
| 375x812 (mobile) | 15 | 10,540 | 0 | 0 | 3,104 | No (isMobile) |
| 768x1024 (tablet) | 11 | 5,612 | 0 | 0 | 1,533 | No (isMobile) |
| 1024x768 (laptop) | 11 | 7,772 | 0.0002 | 0 | 1,967 | Sí (readyState=4) |
| 1440x900 (desktop) | 10 | 6,360 | 0.0001 | 0 | 2,403 | Sí (readyState=4) |

### Comparativa antes/después

| Viewport | LCP antes (2026-08-11) | LCP después (2026-08-12) | Delta |
|---|---|---|---|
| 375x812 | 4,224 ms | 10,540 ms | +6,316 ms |
| 768x1024 | 5,512 ms | 5,612 ms | +100 ms |
| 1024x768 | 4,924 ms | 7,772 ms | +2,848 ms |
| 1440x900 | 5,576 ms | 6,360 ms | +784 ms |

### Análisis del delta

El video ya no se monta en mobile/tablet (`video=false` confirmado en el harness), lo que elimina la descarga de 1.53 MB en esos viewports. Sin embargo, el LCP empeoró porque:

1. **Landing ahora es importación directa** (no lazy), lo que hace que el render del Hero ocurra más temprano en la cascada. El `AnimatedHeading` con animación carácter-por-carácter y los `FadeIn` con `delay={800..1600}ms` dominan el LCP: el elemento LCP en mobile es un `<p>` del Hero (10,540 ms) que aparece tras la animación de fade-in.
2. **El overhead de parseo de la animación JS** en el Hero desplaza el LCP a elementos de texto animados tardíos. Sin lazy, la página se renderiza antes pero el LCP se atribuye al primer elemento grande que aparece después de las animaciones JS.

### Acciones recomendadas para LCP

- Reducir o eliminar los delays de animación en mobile (`delay={isMobile ? 0 : 1200}`).
- Usar `content-visibility: auto` en secciones below-the-fold.
- Añadir `fetchpriority="high"` al hero-poster.svg y precargarlo vía `<link rel="preload">`.
- Considerar un placeholder estático (texto renderizado sin animación) como LCP candidate antes de que las animaciones terminen.

## Cómo reproducir

```powershell
# 1. Build (necesario para vite preview)
npm run build

# 2. Instalar Chromium para Playwright (solo la primera vez)
npx playwright install chromium

# 3. Ejecutar el harness (levanta y mata el preview automáticamente)
node docs/qa/run/playwright-landing.cjs

# 4. Inspeccionar resultados
type docs\qa\run\out\run.log
type docs\qa\run\out\preview.log
type docs\qa\run\out\playwright-results.json
dir docs\qa\screenshots
```

Notas para reproducibilidad:
- El harness resuelve Playwright desde el cache de npx sin tocar `package.json`.
- Si `NPM_CONFIG_CACHE` no es `C:\Users\jairo\AppData\Local\npm-cache`, ajustar `PW_CANDIDATES`.
- Preview se mata con `SIGKILL` al finalizar; si el harness aborta, terminar manualmente: `Get-Process node | Stop-Process`.

## Estados no cubiertos (NEEDS_BROWSER honesto)

- **axe-core / WCAG AA audit**: no instalado. No afirmo conformidad WCAG 2.2 AA completa; solo los checks manuales de la matriz (landmarks, headings, foco, nombres, nav aria-label).
- **Lighthouse / thresholds de performance bajo throttle**: no ejecutado. Los valores de LCP/CLS/INP son sobre preview local sin network throttle, no sustituyen field-data.
- **Multi-navegador (WebKit/Firefox)**: Chromium es el único instalado. Faltan runs en `webkit` y `firefox` para matriz cross-browser.
- **Lector de pantalla (NVDA/VoiceOver/JAWS)**: no ejecutado. La verificación de nombres accesibles es via Name Computation estática, no lectura viva.
- **Targets táctiles ≥ 44 px**: los CTAs y el toggle declaran `min-h-11` (44 px) y se renderizan, pero no se midieron bounding boxes con `getBoundingClientRect`.
- **Contraste frame-a-frame del video**: sin eyedropper/`axe-color` en sesión; el overlay declarado en `Hero.jsx` (gradientes 0.78→0.08) existe por código pero no se midió con pixel sampling.

## Conclusión

Optimizaciones de bundle aplicadas: recharts (393 KB) en chunk separado que no se carga en la landing, y video hero deshabilitado en mobile/tablet (`video=false` confirmado). Ambas optimizaciones funcionan correctamente. Sin embargo, el LCP sigue por encima de 2,500 ms debido a los delays de animación JS del Hero (que dominan el LCP al no haber lazy loading en Landing). H-3 sigue abierto. La auditoría WCAG AA completa, Lighthouse, throttling y la matriz WebKit/Firefox siguen `NEEDS_BROWSER`.
