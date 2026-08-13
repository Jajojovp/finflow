# Contexto de la auditoría FinFlow

## Objeto
Auditoría de flujos de datos, KPIs y lógica de negocio de **FinFlow** en producción
(repo `afde-complete`, rama actual, sin tag de release identificado en HEAD).

## Alcance
Auditoría de solo lectura (`NO implementes nada, solo reporta`). Cubre los
servicios financieros (`KPICalculator`, `CashFlowService`, `ForecastingService`,
`BenchmarkService`, `CovenantService`), el núcleo matemático (`MathUtils`), el
agente (`AgentOrchestrator`, `useAgentManager`), los datos de ejemplo
(`datasets.js`), las páginas (`Dashboard`, `Analysis`, `Forecast`, `Settings`),
el `Modal.jsx` y el `DataValidator`.

## Severidades usadas
| Etiqueta   | Significado                                                                  |
|------------|------------------------------------------------------------------------------|
| BLOCKING   | Funcionalidad crítica rota o ausente; impide el caso de uso principal.       |
| HIGH       | Lógica incorrecta o mensaje engañoso; afecta decisiones del CFO.             |
| MEDIUM     | Inconsistencia, edge case no cubierto o comportamiento subóptimo.            |
| LOW        | Desviación menor de estándares, sin impacto material.                       |
| INFO       | Hallazgo informativo, no requiere acción correctiva.                        |

## Trazabilidad
Cada hallazgo hace referencia a `archivo:línea` absoluta.
La tabla completa de hallazgos está en `hallazgos.md`.

## Síntesis ejecutiva
1. **BLOCKING:** no existe ningún uploader de CSV ni mecanismo de carga de
   datos. Cada página importa `MONTHLY_FINANCIALS` directamente desde
   `src/data/datasets.js` (hard-codeado). El modal `Modal.jsx` es presentacional
   y no contiene lógica de carga. `DataValidator.js` no se invoca desde la app.
2. **BLOCKING:** no hay contexto compartido ni persistencia (`localStorage`,
   state store, DataContext). Recargar la página reinicia el estado y pierde
   cambios de Settings. Las páginas no se comunican entre sí vía datos.
3. **BLOCKING:** `CovenantService.evaluate` se invoca desde `Forecast.jsx` sin
   pasarle el snapshot KPI (3er arg ausente). 3 de cada 4 covenants no resuelven
   su métrica y siempre devuelven `unknown`. El panel "Covenant monitoring"
   está inerte para el 75% de las filas.
4. **HIGH:** el `KPICalculator` mezcla agregados (Σ de todo el periodo) con
   medidores de último mes (revenueGrowth, marginDelta) en el mismo snapshot,
   rompiendo la consistencia semántica que el Dashboard asume.
5. **HIGH:** `runwayMonths` del sample dataset siempre es `null` (la empresa es
   rentable → burn > 0 → no runway). La tarjeta "Cash runway" del Dashboard
   muestra permanentemente `—` en el demo, contradiciendo el claim comercial.
6. **HIGH:** `stressTest` de `CashFlowService` no modela cobros de receivables
   acumuladas; aplica la misma curva `1 - exp(-w/DSO)` a ingresos semanales
   futuros sin inventario de cuentas por cobrar.
7. **HIGH:** `studentTQuantile` devuelve 4.303 para `dof < 2` (debería ser
   ~12.706 para dof=1); 1.96 para `dof > 40` (cota razonable). Aceptable para
   la V3 porque el camino mínimo (n≥5 → dof≥3) está dentro, pero deja el
   intervalo mal acotado para backtests cortos.