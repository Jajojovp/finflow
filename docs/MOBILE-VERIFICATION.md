# FinFlow móvil 1.2.0 · verificación actualizada el 30 de octubre de 2026

## Procedencia y alcance

La app vive en `mobile/`, dentro del historial de `Jajojovp/finflow`. Importa los motores originales mediante `WorkspaceAnalysis` y reutiliza las fórmulas y el parser CSV de `src/workspace`. `KPICalculator.d.ts` declara la frontera de tipos existente; no sustituye su implementación.

Utiliza Expo SDK 58 y las guías oficiales de `expo/skills`, revisión `8a0dc4fa57ae345923c357e1451cbcd8b6f2a7db`. La web conserva GSAP y DM Sans local. La app conserva la paleta clara, utiliza la fuente y navegación del sistema, controles `@expo/ui` y movimiento reducido.

## Comprobaciones automatizadas

- 87 pruebas Vitest: los servicios originales y 11 casos de datos móviles. Cubren separación de perfiles/clientes, fórmulas compartidas, validación, CSV, identificadores, archivo, recuperación y límites de respaldo.
- 17 pruebas Node: caja, resultados, equilibrio, escenarios, CSV, catálogo de descargas y contratos de identidad.
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

## Monedas · 30 de octubre de 2026

La web 2.4.0 y el código móvil 1.1.0 comparten un catálogo de 176 monedas ISO 4217. CLP, ARS, USD y CAD aparecen primero; se puede buscar por código o nombre. La selección pertenece a cada espacio o cliente y se conserva en el respaldo móvil. Los importes muestran el código y los decimales de la unidad; cambiarla conserva las cifras, sin conversión de divisas.

Se ejecutaron 88 pruebas Vitest, 17 pruebas Node de movimientos, fórmulas, monedas y descargas, y la comprobación estricta de TypeScript móvil. Los casos nuevos comprueban las 176 monedas en respaldos, la separación entre clientes, el formato, la búsqueda y la precisión de tres y cuatro decimales.

En navegador se comprobó la selección y persistencia de ARS, la independencia de CAD en Empresa y la portada en CLP. El selector contiene las 176 opciones y no desborda a 375 × 844. La web pública también se inspeccionó después de publicar. Estas comprobaciones no sustituyen una prueba del APK en teléfono.

## Límites de entrega

No hay emulador ni teléfono disponible en este entorno. Falta validar la instalación, los controles nativos y el retorno de Google en un teléfono físico. No se han solicitado builds de pago, publicado en tiendas ni configurado servicios EAS. La distribución nativa de iOS sigue pendiente de cuenta y firma Apple; la web instalable es la alternativa gratuita.

SQLite en teléfono y almacenamiento del navegador en web; sin sincronización automática, conexión bancaria ni cifrado propio. El acceso opcional con Google abre un espacio separado por cuenta y conserva el modo local anterior. Crecimiento utiliza el respaldo portátil `finflow-backup-v2`, compartido con la web y compatible con los respaldos `finflow-mobile-v1` y datos web anteriores. CSV permite añadir movimientos con revisión previa. Las proyecciones son hipotéticas y las propuestas son informativas.

La auditoría móvil registra ocho avisos transitivos en herramientas del SDK; alcance y referencias en `mobile/SECURITY.md`. No se presenta la entrega como certificación de seguridad ni como distribución aprobada para tiendas.

## Instalador Android

Se generó un APK release ARM64 de 45.799.045 bytes, firmado con el certificado propio de FinFlow y verificado mediante apksigner y zipalign con páginas de 16 KB. No es depurable y contiene el bundle de la aplicación y el flujo de acceso Google. Procedencia, hash y distribución en [DISTRIBUTION.md](DISTRIBUTION.md). Esto no sustituye una prueba en teléfono físico.

## Corrección Android 1.0.1

El log del teléfono identificó la dependencia ausente `expo-symbols` en los iconos `md` de NativeTabs. La versión 1.0.1 (código 2) incluye ~58.0.4, se recompiló con caché de Metro vacía y se verificó el renderizador y la fuente Material Symbols en el APK. Firma v2 y certificado de FinFlow correctos, zipalign 16 KB correcto, hash distinto del APK defectuoso. El verificador rechaza la versión anterior. Los recuentos anteriores documentan la base validada; esta corrección se comprueba en el artefacto y su distribución.

## APK Android 1.1.0

Versión interna 3, firma v2 con el mismo certificado de FinFlow, alineamiento de 16 KB correcto y aplicación no depurable. El verificador del artefacto confirma el selector nuevo, CLP, ARS, USD, CAD, KWD y CLF en el bundle, y la fuente Material Symbols. Se rechazaron las huellas de 1.0.0 y 1.0.1; el archivo nuevo tiene una huella distinta. El código móvil coincide con el commit de procedencia del recibo. La prueba en teléfono físico sigue pendiente.

## Crecimiento · primer hito

Web 2.5.0 y móvil 1.2.0 incorporan respaldo portátil, restauración completa con recuperación, revisión CSV y gestión reversible de clientes. El almacenamiento web usa IndexedDB; Android conserva SQLite. Pasaron 91 pruebas Vitest, 50 pruebas Node, TypeScript y build web. ESLint mantiene cuatro advertencias anteriores, sin errores.

En navegador local se verificaron migración, guardado/recarga, conflicto entre pestañas (1.600 ARS se conserva frente al intento de 1.700), CSV inválido/cancelado/confirmado/repetido, restauración completa y recuperación de los espacios anteriores. En Expo web se probaron revisión CSV, repetición sin duplicados, copia/restauración en CLP y recuperación del respaldo anterior en EUR, y creación/archivo/restauración del cuarto cliente. No se utilizaron datos financieros reales.

El APK 1.2.0 tiene código 4 y se compiló del commit `08139d88991a7fbe5164b693e5b73b85db62145b`. Tiene 45.821.533 bytes y SHA-256 `782b66b33b5f45981c47e1a9308f868f101b139613bfe3664ac27ff8650f863e`. Firma propia v2, certificado esperado, alineamiento de 16 KB y ausencia de depuración comprobados. El verificador se ejecutó en el checkout de compilación `C:/ffn`, que conserva las dependencias nativas, e identificó la fuente Material Symbols y las funciones de Crecimiento en el bundle de 3.494.776 bytes. Rechaza también la huella del APK 1.1.0.

El 31 de octubre de 2026 se publicó el paquete mediante Hostinger Connector en finflow.sysora.io: web 2.5.0 y APK 1.2.0. Se descargó el APK público completo y coincidieron sus 45.821.533 bytes y SHA-256 con el artefacto firmado local. Los enlaces 1.0.0, 1.0.1 y 1.1.0 responden con redirección a 1.2.0. Los 14 archivos web comprobados coinciden byte a byte con el build; el endpoint de sesión mantiene `configured: true`. La verificación visual pública no pudo repetirse porque el control local de navegador está deshabilitado en Work.

Sites conserva la publicación privada anterior de esta fase, con descarga pendiente; su actualización no se realizó porque la conexión actual devuelve `project_not_found`. La instalación y apertura en teléfono físico, el retorno nativo de Google y la comprobación actual de Safari/iPhone siguen pendientes. La interfaz Expo web y la firma no sustituyen esas comprobaciones.


## Crecimiento conjunto · Android 1.3.0

Versión interna 5, ARM64, 45.770.561 bytes; fuente `a2df28b6a8d8e488b42b9ae8b48659c260adfee7` y SHA-256 `560e95fc155f17bedb97fbc52fc2b9515cffa6fd5405eaac54e1f4ad6afd9fa0`. La compilación completa del SDK y la recompilación final fueron correctas. Se verificaron firma v2 con el certificado anterior, metadatos, ausencia de depuración, zipalign 16 KB y alineamiento ELF de las 26 bibliotecas. El verificador exige la revisión exacta, las funciones financieras nuevas, los selectores de pagos, `savingsRate` y la fuente de iconos embebida.

Pasaron 98 pruebas Vitest, 75 Node, seis pruebas PHP, TypeScript y compatibilidad Expo. ESLint conserva cuatro advertencias anteriores y cero errores. La revisión visual se aplazó por instrucción del titular. ADB devolvió cero dispositivos listos: no se declara instalación, apertura, retorno nativo de Google ni prueba actual en iPhone. La publicación canónica se comprueba separadamente mediante descarga completa y comparación contra este recibo; Sites sigue sin acceso al proyecto existente.
