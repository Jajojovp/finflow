# Integración de FinFlow con la interfaz actual

El repositorio `Jajojovp/finflow`, revisión inicial `4ee8ed6`, es la base de este trabajo. Su historial, servicios financieros, pruebas y documentación se conservan. La interfaz publicada se incorpora como presentación, sin sustituir el motor financiero original.

## Criterios de aceptación

- Mantener diseño, navegación por hash, GSAP, tres perfiles y datos locales existentes (`finflow-open-v1`).
- Conectar KPICalculator, CashFlowService, ForecastingService, AnomalyService, BenchmarkService, CovenantService, VarianceService y AgentOrchestrator con registros y parámetros de cada entidad.
- Presentar el análisis en Resultados, conservando el estado de resultados, punto de equilibrio y simulador actuales.
- Separar caja de resultados: depreciación sin salida de caja; capital fuera del resultado; otros ingresos identificados.
- Balance, objetivos y límites declarados por el usuario, sin inventar datos faltantes ni presentar objetivos como estadísticas sectoriales.
- Pronóstico solo con al menos cinco meses consecutivos; backtest solo con ocho. No completar meses ausentes con ceros inventados.
- Las propuestas requieren revisión humana y solo guardan decisiones locales. No ejecutan pagos ni comunicaciones.
- Verificar fórmulas, aislamiento entre entidades, persistencia, recorridos actuales y diseño adaptable antes de desplegar.

## Arquitectura

Se conserva Vite/React del repositorio original. `src/workspace` aloja la presentación existente. `WorkspaceAnalysis` adapta los movimientos al contrato mensual de los servicios originales; un componente React presenta sus resultados dentro de la navegación actual. Las páginas históricas permanecen en el repositorio como referencia, sin publicar una segunda navegación.

## Autoría y evidencia

El análisis enlaza al repositorio original y explica método, periodo, entradas y límites. El código permite examinar la metodología financiera y su evolución. La corrección se respalda con pruebas; la interfaz no acredita por sí sola una cualificación profesional.
