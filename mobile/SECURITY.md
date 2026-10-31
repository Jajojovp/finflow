# Alcance de seguridad de esta versión

La app no expone un servidor financiero ni utiliza secretos, credenciales o conexiones bancarias. Valida los movimientos y limita las importaciones antes de guardarlas. Los espacios se separan localmente por perfil y cliente.

La auditoría del SDK Expo 58.0.21 reportó ocho hallazgos transitivos (cinco bajos y tres altos) en el árbol de herramientas Expo CLI: `deepmerge@4.3.1` y `zod@3.25.76`, y sus paquetes dependientes. `npm audit fix` no los resuelve dentro de los rangos oficiales del SDK; la sugerencia automática de forzar una bajada a SDK 51 no se aplica porque rompe la compatibilidad del proyecto. Esos módulos pertenecen a la herramienta de desarrollo, no al código de las pantallas o motores importados por la app.

Referencias de los hallazgos: [deepmerge](https://github.com/advisories/GHSA-gcqx-w48m-w2h4), [zod](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5). Se deben revisar las actualizaciones oficiales del SDK antes de una distribución pública. La auditoría no equivale a una certificación de seguridad del producto.

El servidor de desarrollo debe utilizarse en una red controlada y detenerse cuando no se necesite. El script acepta `-Connection localhost` para limitarlo al propio ordenador.
