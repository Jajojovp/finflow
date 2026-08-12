# FinFlow v3 Dark Luxe - Rollback

**Audiencia:** operaciones e ingenieria de release  
**Tipo:** runbook  
**Estado:** `NEEDS_REVIEW` - no se ha ensayado el rollback.

## Prerequisitos

1. Identifica el commit desplegado y el deployment de Vercel asociado.
2. Confirma que existe un deployment anterior funcional en Vercel.
3. Verifica acceso a Vercel con permisos de deployment y acceso al repositorio Git.
4. Conserva el SHA del candidato, el SHA anterior, la URL de preview y la hora del cambio.
5. No ejecutes rollback si no puedes identificar el deployment anterior; escala a operaciones y al Quality Reviewer.

## Rollback en Vercel

1. Abre el proyecto correcto en Vercel y localiza el deployment de v3 Dark Luxe.
2. Selecciona el deployment anterior conocido como funcional.
3. Usa **Promote to Production** o la accion equivalente de Vercel para ese deployment.
4. Confirma que el dominio de produccion sirve el deployment anterior.
5. Registra deployment ID, hora, operador y motivo en el incidente o ticket de release.

Salida esperada: el dominio vuelve a la version anterior sin editar codigo ni variables de entorno.

## Rollback mediante Git

1. En un checkout limpio, identifica el commit previo al rediseño con `git log --oneline`.
2. Crea una rama de rollback desde el commit aprobado o revierte el commit del rediseño con `git revert <sha>`.
3. Ejecuta `npm ci`, `npm test -- --run`, `npm run build` y `npm run lint`.
4. Abre un PR de rollback y espera las revisiones requeridas.
5. Despliega el PR aprobado mediante el flujo normal de Vercel.

Salida esperada: el build de rollback termina correctamente y Vercel asigna un deployment verificable.

## Validacion posterior

1. Comprueba `/`, `/dashboard`, `/analysis`, `/forecast` y `/settings`.
2. Comprueba que no se solicita `/videos/hero.mp4` en la version anterior si no corresponde.
3. Ejecuta smoke test de navegacion, teclado y carga basica.
4. Revisa logs de Vercel y errores del navegador durante 15 minutos.
5. Declara el incidente resuelto solo con evidencia de URL, deployment y smoke test.

## Escalado

Escala a operaciones y Quality Reviewer ante error 5xx, rutas rotas, perdida de acceso al deployment anterior, cambios de variables de entorno o cualquier incidente P1/P2. El rollback no sustituye la correccion del hallazgo ni el final review.
