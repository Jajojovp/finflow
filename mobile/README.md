# FinFlow móvil

App Expo para iOS y Android, creada dentro del repositorio original. Utiliza SDK 58, React Native, Expo Router y controles de `@expo/ui`. Conserva la paleta clara de FinFlow y utiliza la tipografía del sistema en móvil.

Los ocho motores originales se importan de `../src/services` y las fórmulas de gestión, CSV y simulación de `../src/workspace`. No se ha creado un motor financiero paralelo.

## Iniciar

Requiere Node.js 24 o posterior y Expo Go compatible con SDK 58.

```powershell
cd "C:\Users\jairo\Documents\ChatGPT\app finanzas\finflow-integrated\mobile"
npm ci
.\start-finflow.ps1
```

El script de Windows utiliza el Node compatible instalado con Codex cuando el Node del sistema es anterior. En otros entornos, con Node 24: `npm start`.

Abre Expo Go en el teléfono y usa la dirección que indique Expo CLI. El teléfono y el ordenador deben poder comunicarse en la misma red. La vista web de desarrollo se abre en el puerto que indique el servidor; sirve para revisar la interfaz, no sustituye una prueba en el dispositivo.

## Instaladores y distribución

Consulta [DISTRIBUTION.md](../docs/DISTRIBUTION.md) para generar el APK de Android localmente sin una cuenta Expo. La página web `/descargar/` muestra únicamente publicaciones verificadas. En iPhone se ofrece la app web instalable mientras falta la cuenta Apple Developer para distribuir la app iOS nativa. `eas.json` deja preparados los perfiles futuros, sin crear cuentas ni iniciar servicios de pago.

## Funciones

- Perfiles Personal, Empresa y Asesor, con espacios independientes y clientes adicionales.
- Alta, edición, archivo y recuperación de ingresos y gastos, con clasificación financiera.
- Resumen de caja, ahorro y objetivos; estado de resultados, equilibrio, indicadores, proyección, controles y posibles fugas.
- Configuración de saldo, moneda, presupuesto, balance y límites declarados.
- Simulador de aportaciones y cinco lecciones con progreso local.
- CSV por texto y respaldos JSON mediante el portapapeles. Las importaciones añaden registros y conservan ajustes existentes; los duplicados exactos se omiten.

## Datos y límites

SQLite local en iOS/Android y almacenamiento del navegador en la vista web. Se guarda antes de actualizar la interfaz y los errores conservan el formulario. Los datos de la web publicada y de la app no se sincronizan automáticamente. No hay conexiones bancarias ni ejecución de operaciones financieras. Los resultados son de gestión y las proyecciones son hipotéticas.

La base SQLite utiliza el almacenamiento protegido por el sistema operativo de la aplicación; no incorpora cifrado propio ni autenticación. El portapapeles contiene información financiera cuando el usuario exporta un respaldo: debe elegir dónde guardarla.

## Verificación reproducible

En la raíz del repositorio: `npm test` y `node --test tests/core.test.mjs tests/finance.test.mjs`.

En esta carpeta: `npm run typecheck`, `npx expo install --check`, `npx expo-doctor` y `npx expo export --platform all`.

Para servir la exportación web con recarga de rutas: `python scripts/serve-preview.py` (solo este ordenador, puerto 4175). La entrega verificada también se conserva en `dist-release/`; puede abrirse con `python scripts/serve-preview.py --directory dist-release`.

Las comprobaciones y la prueba en dispositivo físico pendiente se detallan en [MOBILE-VERIFICATION.md](../docs/MOBILE-VERIFICATION.md). Los avisos conocidos de las herramientas Expo están registrados en [SECURITY.md](SECURITY.md).

## Guías utilizadas

Se utilizaron las guías oficiales de [expo/skills](https://github.com/expo/skills), revisión `8a0dc4fa57ae345923c357e1451cbcd8b6f2a7db`: overview, estructura, Router, UI nativa, diseño y animación. Están instaladas localmente en `.agents/skills/` del proyecto y disponibles para los próximos turnos. En la web se mantiene GSAP; las vistas nativas usan las transiciones de plataforma, controles nativos y movimiento reducido.

El icono proviene del SVG original `../public/favicon.svg`, convertido a PNG con `sharp-cli`.
