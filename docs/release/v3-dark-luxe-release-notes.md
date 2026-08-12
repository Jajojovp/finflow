# FinFlow v3 Dark Luxe - Release Notes

**Audiencia:** ingenieria, QA, operaciones y producto  
**Estado:** `NEEDS_REVIEW` - estas notas no autorizan un release.

## Alcance

Este cambio rediseña la landing publica de FinFlow con una direccion visual Dark Luxe. No cambia el motor financiero, la persistencia, la autenticacion ni la arquitectura de negocio.

## Archivos y features

- `index.html`: metadata basica, fuentes y color de tema.
- `src/pages/Landing.jsx`: composicion de la landing y separacion del navegador.
- `src/components/landing/LandingNav.jsx`: navegacion desktop/mobile.
- `src/components/landing/Hero.jsx`: hero con video, CTAs y metricas.
- `src/components/landing/Features.jsx`: capacidades principales.
- `src/components/landing/HowItWorks.jsx`: flujo de trabajo.
- `src/components/landing/Metrics.jsx`: metricas de confianza.
- `src/components/landing/CTA.jsx`: llamada final a la accion.
- `src/components/landing/Footer.jsx`: pie y enlaces.
- `src/components/landing/TextRollButton.jsx`: boton animado.
- `src/components/animations/`: `FadeIn` y `AnimatedHeading`.
- `src/components/common/Logo.jsx`: marca reutilizable.
- `src/styles/global.css` y `tailwind.config.js`: tokens, superficies, motion y reduced motion.
- `public/videos/hero.mp4`: asset local del hero.
- `public/images/hero-poster.svg`: poster ligero y fallback visual del hero.
- `public/favicon.svg`: favicon actualizado.

## Video hero

El componente referencia `/videos/hero.mp4` con `autoplay`, `muted`, `loop`, `playsInline`, poster local y `aria-hidden="true"`. Usa `preload="none"` en mobile y `metadata` en desktop; reduced motion evita montar el video y conserva el fondo solido. La inspeccion local identifica H.264, 1920x1080, 12 segundos y 1,531,481 bytes. La efectividad sobre LCP, error de carga y navegadores alternos requiere nueva evidencia; no es aprobacion automatica.

## Correcciones de QA

- H-1: Escape cierra el menu mobile, limpia el listener y devuelve foco al toggle.
- H-3: poster SVG y estrategia de preload responsive para evitar que el video compita con el LCP mobile.
- Footer: destinos no implementados se presentan como texto no interactivo `Coming soon`.
- Navegacion y footer: logo links con target minimo de 44 px; menu conserva `aria-expanded`, `aria-controls` y labels dinamicos.
- Tipografia: carga unica de Google Fonts con DM Serif Display, Inter y JetBrains Mono; `font-display` usa DM Serif Display y el cuerpo conserva Inter.

## Verificaciones conocidas

- `npm test -- --run`: PASS local, 7 archivos y 68 tests aprobados.
- `npm run build`: PASS local con Vite 5.4.21; chunk `charts` de 383.32 kB y `Landing` de 19.57 kB.
- `npm run lint`: 0 errores y 14 warnings; varios son de accesibilidad en paginas existentes.
- `npm audit --json`: 1 vulnerabilidad `high` y 1 `moderate`, relacionadas con Vite/esbuild; la correccion disponible implica salto mayor a Vite 8.2.1.
- `git status --short`: el rediseño sigue en cambios locales, sin evidencia de commit o despliegue.
- La ejecucion Chromium local del 2026-08-11 valida H-1; H-3 mantiene LCP fuera de objetivo (3484/4312/5244/5084 ms). Staging, Lighthouse/Core Web Vitals bajo throttle, SAST, DAST, secret scan, SBOM, cobertura, mutation testing, load test y rollback siguen pendientes.

## Limitaciones y decision

La landing conserva claims y rutas que requieren validacion de producto (`/dashboard`, `/forecast` y copy de inteligencia/precision). El prototipo no debe presentarse como apto para datos financieros reales. El release queda bloqueado hasta completar el plan QA, la revision de seguridad, la evidencia visual y el sign-off final.
