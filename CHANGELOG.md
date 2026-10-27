# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses [Semantic Versioning](https://semver.org/).

## [2.1.0] - 2026-10-27

### Added

- Integración de los motores financieros originales con los movimientos de cada entidad, conservando diseño, navegación, GSAP y tres perfiles.
- Panel de indicadores, balance editable, presupuesto de ventas, metas, controles, pronósticos, backtest y escenarios de caja dentro de Resultados.
- Propuestas con revisión y evidencia exportable, sin ejecutar operaciones financieras.

### Fixed

- Signo invertido del consumo en autonomía de caja, tratamiento de otros ingresos y propagación de costes faltantes.
- Exclusión de datos futuros y meses ausentes en las proyecciones.

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
