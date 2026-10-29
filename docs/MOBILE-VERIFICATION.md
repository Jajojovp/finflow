# FinFlow móvil 1.0.0 · verificación actualizada el 29 de octubre de 2026

## Procedencia y alcance

La app vive en `mobile/`, dentro del historial de `Jajojovp/finflow`. Importa los motores originales mediante `WorkspaceAnalysis` y reutiliza las fórmulas y el parser CSV de `src/workspace`. `KPICalculator.d.ts` declara la frontera de tipos existente; no sustituye su implementación.

Utiliza Expo SDK 58 y las guías oficiales de `expo/skills`, revisión `8a0dc4fa57ae345923c357e1451cbcd8b6f2a7db`. La web conserva GSAP y DM Sans local. La app conserva la paleta clara, utiliza la fuente y navegación del sistema, controles `@expo/ui` y movimiento reducido.

## Comprobaciones automatizadas

- 87 pruebas Vitest: los servicios originales y 11 casos de datos móviles. Cubren separación de perfiles/clientes, fórmulas compartidas, validación, CSV, identificadores, archivo, recuperación y límites de respaldo.
- 16 pruebas Node: caja, resultados, equilibrio, escenarios, CSV, catálogo de descargas y contratos de identidad.
- 6 pruebas del servidor PHP: CSRF, estado, PKCE, caducidad, consumo único, sesión nativa y límites de intentos.
- Acceso real con Google y cierre de sesión comprobados en finflow.sysora.io; el espacio muestra el nombre verificado de la cuenta.
- TypeScript estricto sin errores; `expo install --check` sin incompatibilidades.
- ESLint web: cero errores y seis advertencias existentes (roles de accesibilidad e importaciones sin uso). Reconoce los módulos `.mjs` y el global GSAP del navegador; conserva las reglas suaves del proyecto.
- Expo Doctor del 28 de octubre: 20 de 20 comprobaciones aprobadas; no se presenta como una nueva ejecución del 29.
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

No hay emulador ni teléfono disponible en este entorno. Falta validar la instalación, los controles nativos y el retorno de Google en un teléfono físico. No se han solicitado builds de pago, publicado en tiendas ni configurado servicios EAS. La distribución nativa de iOS sigue pendiente de cuenta y firma Apple; la web instalable es la alternativa gratuita.

SQLite en teléfono y almacenamiento del navegador en web; sin sincronización automática, conexión bancaria ni cifrado propio. El acceso opcional con Google abre un espacio separado por cuenta y conserva el modo local anterior. Los respaldos de la app tienen formato propio `finflow-mobile-v1`; CSV permite añadir movimientos. Las proyecciones son hipotéticas y las propuestas son informativas.

La auditoría móvil registra ocho avisos transitivos en herramientas del SDK; alcance y referencias en `mobile/SECURITY.md`. No se presenta la entrega como certificación de seguridad ni como distribución aprobada para tiendas.
