# FinFlow móvil 1.0.0 · verificación del 28 de octubre de 2026

## Procedencia y alcance

La app vive en `mobile/`, dentro del historial de `Jajojovp/finflow`. Importa los motores originales mediante `WorkspaceAnalysis` y reutiliza las fórmulas y el parser CSV de `src/workspace`. `KPICalculator.d.ts` declara la frontera de tipos existente; no sustituye su implementación.

Utiliza Expo SDK 58 y las guías oficiales de `expo/skills`, revisión `8a0dc4fa57ae345923c357e1451cbcd8b6f2a7db`. La web conserva GSAP y DM Sans local. La app conserva la paleta clara, utiliza la fuente y navegación del sistema, controles `@expo/ui` y movimiento reducido.

## Comprobaciones automatizadas

- 87 pruebas Vitest: los servicios originales y 11 casos de datos móviles. Cubren separación de perfiles/clientes, fórmulas compartidas, validación, CSV, identificadores, archivo, recuperación y límites de respaldo.
- 10 pruebas Node de las fórmulas de caja, resultados, equilibrio, escenarios y CSV.
- TypeScript estricto sin errores; `expo install --check` sin incompatibilidades.
- Expo Doctor: 20 de 20 comprobaciones aprobadas.
- Exportaciones Metro/Hermes de iOS y Android, más la vista web de producción. Exportar estos recursos no genera una instalación firmada ni demuestra ejecución en un dispositivo.

## Interfaz verificada en navegador

Datos sintéticos, guardados en el origen local de la vista Expo; no se utilizaron registros financieros reales.

- Empresa: alta de venta por 10.000, coste variable por 4.000 y gasto fijo por 3.000. Resultado neto 3.000, margen 30%, equilibrio 5.000 y contribución 60%.
- Disponible configurado en 5.000: el saldo inicial se ajusta a 2.000 sin alterar los movimientos; balance de prueba y razón corriente 2,67 calculados por el motor original.
- Importe negativo rechazado con el formulario conservado; posterior corrección y guardado.
- Edición, archivo recuperable y restauración de gasto; registro conservado tras recargar.
- Cambio a Asesor con datos separados y creación de Cliente 4.
- CSV válido importado y repetición sin duplicación; fecha 2026-02-31 rechazada.
- Respuesta incorrecta en una lección con retroalimentación; respuesta correcta guarda el progreso.
- Objetivo actualizado a 10.000 con 2.500 reservados. Aportación mensual del simulador cambiada de 200 a 300: aportaciones a cinco años pasan de 12.000 a 18.000.
- Perfil personal con ejemplos y revisión de la interfaz a 390 × 844; comprobación de navegación entre perfiles.

## Límites de entrega

No hay emulador ni teléfono disponible en este entorno. Falta validar la instalación y los controles de iOS/Android en un dispositivo físico con Expo Go compatible. No se han solicitado builds de pago, firmado binarios, publicado en tiendas ni configurado servicios EAS.

SQLite en teléfono y almacenamiento del navegador en web; sin sincronización automática, conexión bancaria, autenticación ni cifrado propio. Los respaldos de la app tienen formato propio `finflow-mobile-v1`; CSV permite añadir movimientos. Las proyecciones son hipotéticas y las propuestas son informativas.

La auditoría móvil registra ocho avisos transitivos en herramientas del SDK; alcance y referencias en `mobile/SECURITY.md`. No se presenta la entrega como certificación de seguridad ni como distribución aprobada para tiendas.
