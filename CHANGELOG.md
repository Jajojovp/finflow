# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses [Semantic Versioning](https://semver.org/).

## [2.4.0] - 2026-10-30

### Added

- Selector de moneda visible y buscable, con catálogo compartido de 176 códigos ISO 4217 de SIX (publicación 2026-09-17).
- CLP, ARS, USD y CAD destacados; preferencia independiente por espacio y por cliente del asesor, persistente y restaurable.
- Código de moneda visible en los importes y precisión ISO de cero, dos, tres y cuatro decimales en formato y cálculos compartidos.
- Android móvil 1.1.0, código 3. Cambiar la unidad conserva los registros y no aplica un tipo de cambio implícito.

## [2.3.0] - 2026-10-29

### Fixed

- Android móvil 1.0.1 (versión interna 2): incluye `expo-symbols` para evitar el cierre al dibujar los iconos Material de las pestañas.
- La compilación comprueba versión, fecha de generación y hash, y rechaza el APK defectuoso anterior antes de generar el recibo de publicación.

### Added

- Acceso opcional con Google mediante el proyecto FinFlow autorizado, código de autorización, PKCE y estado de un solo uso.
- Sesiones web seguras y retorno a Android ligado al verificador de la app y a un código entregado por el navegador.
- Espacios locales independientes para cada cuenta, conservación del modo local y página de privacidad.
- Pruebas de caducidad, reutilización, CSRF, límites de intentos y validación de identidades.

## [2.2.0] - 2026-10-28

### Added

- Página de descargas e instalación para Android, iPhone y web, enlazada desde el sitio y la aplicación.
- Manifiesto e iconos para añadir la web a la pantalla de inicio; la apertura conserva el perfil local.
- Configuración de distribución Expo y compilación local de APK con firma propia, verificación de certificado y recibo de publicación.
- Catálogo de descargas que mantiene pendientes los canales sin un instalador verificado; pruebas de validación de URL, firma y metadatos.

## Mobile [1.0.0] - 2026-10-28

### Added

- App Expo para iOS y Android dentro del repositorio original, con Router, controles nativos, paleta clara y almacenamiento SQLite local.
- Perfiles Personal, Empresa y Asesor, clientes independientes, movimientos editables y recuperables, resultados, equilibrio, indicadores originales, objetivos, simulación y lecciones.
- Importación CSV y respaldo JSON con validación, conservación de ajustes y comprobaciones de límites antes de guardar.
- Pruebas de aislamiento, fórmulas compartidas, importaciones, recuperación y persistencia; instrucciones reproducibles y límites de validación física documentados.

## [2.1.1] - 2026-10-28

### Fixed

- Restaurada la jerarquía de la primera versión clara; los resúmenes y resultados vuelven a ocupar el inicio y el análisis avanzado se abre a demanda.
- DM Sans se sirve localmente con su licencia para mantener la tipografía aprobada sin depender de Google Fonts.

## [2.1.0] - 2026-10-27

### Added

- Integración de los motores financieros originales con los movimientos de cada entidad, conservando diseño, navegación, GSAP y tres perfiles.
- Panel de indicadores, balance editable, presupuesto de ventas, metas, controles, pronósticos, backtest y escenarios de caja dentro de Resultados.
- Propuestas con revisión y evidencia exportable, sin ejecutar operaciones financieras.

### Fixed

- Signo invertido del consumo en autonomía de caja, tratamiento de otros ingresos y propagación de costes faltantes.
- Exclusión de datos futuros y meses ausentes en las proyecciones.
- Actualización de herramientas de desarrollo heredadas vulnerables; auditoría completa sin hallazgos.

## [Unreleased]

### Added

- Dark Luxe landing documentation, QA plan, visual/accessibility report, traceability matrix and rollback runbook.
- Local hero video asset and landing animation components are documented as part of the pending v3 review.

### Changed

- Landing navigation, hero, feature sections, process section, metrics, CTA, footer, typography and dark theme tokens were updated in the local working tree.

### Security

- Recorded the current passive security scope and the `npm audit` result without claiming remediation or release approval.

### Release status

- v3 Dark Luxe remains `REJECT` / `NEEDS_REVIEW` pending browser QA, security review, product claims review, rollback rehearsal and final sign-off.
