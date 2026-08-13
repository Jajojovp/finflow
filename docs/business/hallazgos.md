# Hallazgos de la auditoría FinFlow — tabla completa por flujo/servicio

> Severidad: BLOCKING / HIGH / MEDIUM / LOW / INFO
> Lógica: solo lectura, sin implementar nada.

## Resumen por servicio

| Servicio / Flujo            | ARCHIVO                                                        | BLOCKING | HIGH | MED | LOW | INFO |
|-----------------------------|----------------------------------------------------------------|:-------:|:--:|:--:|:--:|:----:|
| 1. Carga de datos           | (no existe) + `Modal.jsx`, `DataValidator.js`                  |    3    |  1  |  1  |  0  |  1   |
| 2. KPICalculator            | `src/services/financial/KPICalculator.js`                       |    0    |  2  |  4  |  2  |  1   |
| 3. CashFlowService          | `src/services/financial/CashFlowService.js`                    |    0    |  2  |  2  |  0  |  1   |
| 4. ForecastingService       | `src/services/financial/ForecastingService.js`                 |    0    |  2  |  2  |  0  |  2   |
| 5. BenchmarkService         | `src/services/financial/BenchmarkService.js`                    |    0    |  0  |  2  |  0  |  1   |
| 6. CovenantService          | `src/services/financial/CovenantService.js`, `Forecast.jsx`    |    1    |  1  |  0  |  0  |  1   |
| 7. AgentOrchestrator        | `src/services/agent/AgentOrchestrator.js`, `useAgentManager.js` |    0    |  2  |  0  |  1  |  2   |
| 8. Datos de ejemplo        | `src/data/datasets.js`                                         |    0    |  1  |  1  |  0  |  1   |
| 9. Consistencia de datos    | `Dashboard.jsx`, `Analysis.jsx`, `Forecast.jsx`, `Settings.jsx`|    2    |  2  |  1  |  0  |  1   |
| 10. Edge cases criticos    | (todos)                                                         |    0    |  3  |  0  |  0  |  1   |
| **TOTAL**                   |                                                                | **6**   |**16**|**13**|**3**|**12**|

---

## 1. Flujo de carga de datos

> Material del briefing (uploader, CSV validation, feedback, persistencia) vs realidad.

| # | Sev | Descripción | Ubicación | Recomendación |
|---|-----|-------------|-----------|---------------|
| 1.1 | **BLOCKING** | No existe ningún uploader de CSV. Búsqueda global de `PapaParse`, `FileReader`, `<input type="file">`, `Upload` y `csv` solo regresa hits en marketing estático en `Landing`. La promesa "From upload to insight" es vapor. | `src/components/landing/Hero.jsx:9`, `Metrics.jsx:6`, `HowItWorks.jsx:7-12` | Implementar uploader real con parsing (p. ej. papaparse), mapping de columnas y validación. Mientras tanto, retirar el claim de marketing. |
| 1.2 | **BLOCKING** | `Modal.jsx` es **presentacional puro**: recib un `children`, no tiene lógica de carga ni `<input type="file">`. No es el modal de carga de datos. | `src/components/ui/Modal.jsx:13-88` | Si se esperaba que fuese el modal de carga, crear `UploadModal.jsx` con FileReader + validación. |
| 1.3 | **BLOCKING** | No se preserva nada entre páginas. Búsqueda global de `localStorage`, `sessionStorage`, `useDashboard`, `DataContext`, `useDataStore` no encuentra nada. Cada página declara `useMemo(() => ..., MONTHLY_FINANCIALS)` independientemente. La app NO es multi-página, son 5 páginas estáticas con el mismo fixture. | `Dashboard.jsx:21`, `Analysis.jsx:24-26`, `Forecast.jsx:25-29` | Crear un `DataProvider` (context + reducer) o store mínimo (Zustand/Jotai) que persista a `localStorage`. |
| 1.4 | HIGH | `DataValidator.js` **no se invoca en runtime**. Solo se valida en tests. Cualquier uploader que se construya después tendrá la base ya escrita, pero hoy el dato entra/sale del fixture sin validación. | `src/services/core/DataValidator.js:1-83` (sin callers en `src/` excepto tests) | Conectar `DataValidator.validateSeries` al UI de carga y mostrar `issues[]` en toast/banner. |
| 1.5 | MEDIUM | `DataValidator` no valida `cogs`, `opex`, `daa`, `interest`, `tax`, `ar`, `inventory`, `ap`, `shortDebt`, `longDebt`, `equity`, `budget` (solo `revenue`, `expenses`, `cash`). El `KPICalculator` los consume; si llegan faltantes vía CSV se propagarán como `null` y KPIs de balance caerán en cascade. | `src/services/core/DataValidator.js:34-43` | Ampliar el listado obligatorio/opcional a todos los campos del §7.1/§7.2. |
| 1.6 | INFO | `DataValidator.isContinuous` calcula diferencia en meses correctamente, pero `validateSeries` no lo usa. La continuidad cronológica no se garantiza. | `src/services/core/DataValidator.js:71-80` | Llamar `isContinuous` en el pipeline del uploader. |

### Comportamiento de edge cases de carga (hipotético, una vez exista uploader)
| Caso                     | Comportamiento actual                                          |
|--------------------------|----------------------------------------------------------------|
| CSV con formato incorrecto | N/A — no hay uploader.                                       |
| CSV con columnas faltantes | N/A.                                                         |
| CSV con 0 filas            | N/A.                                                         |
| CSV con 1 fila             | N/A. Si llegara a `ForecastingService.forecast`, devolvería `EMPTY_FORECAST` (MIN_POINTS=5). |
| Feedback de éxito/error    | No existe ningún canal (no hay toasts; no hay useToast).     |

---

## 2. KPICalculator — `src/services/financial/KPICalculator.js`

> 30 KPIs derivados. Lista completa abajo.

### Catálogo de KPIs

| Campo              | Fórmula (línea)                                            | Significado de negocio | Útil para CFO/analista | Fórmula correcta | Edge cases |
|--------------------|------------------------------------------------------------|------------------------|------------------------|------------------|------------|
| `totalRevenue`     | Σ `revenue` (L91)                                          | Ingresos del período (agregado) | Sí | Sí | OK |
| `totalExpenses`    | Σ `expenses` (L93)                                         | Gastos del período | Sí | Sí, pero la descomposición (cogs+opex+daa+interés+tax) no se reconcilia contra `expenses` para detectar inconsistencias de fixture | LOW |
| `netIncome`        | `totalRevenue - totalExpenses` (L95)                       | Resultado neto del período | Siempre | **Mezcla semántica**: arriba es agregado, pero `marginDelta` (abajo) usa `last.revenue-last.expenses` por mes. No es comparable al `netIncome` que aparece en el mismo snapshot | HIGH |
| `totalCogs`        | Σ `cogs` o `null` si no hay cogs (L98-100)                | COGS agregado | Sí | Sí | OK fail-closed |
| `grossProfit`      | `totalRevenue - totalCogs` (L102)                          | Beneficio bruto | Sí | Sí, AGREGADO | OK |
| `grossMargin`      | `grossProfit / totalRevenue` (L104)                        | Margen bruto | Sí | Sí, AGREGADO | OK; null si `totalRevenue=0` |
| `totalOpex`        | Σ `opex` (L107)                                            | OpEx agregado (no COGS, no D&A) | Sí | Sí | OK |
| `totalDaa`         | Σ `daa` (L109)                                             | Depreciación + Amortización | Sí | Sí | OK |
| `ebit`             | `grossProfit - totalOpex - totalDaa` (L111)              | EBIT = GM - OpEx - D&A | Sí | Sí | Null si cogs ausente |
| `operatingMargin`  | `ebit / totalRevenue` (L113)                              | Margen operativo (EBIT/Revenue) | Sí | Sí | OK |
| `ebitda`           | `ebit + totalDaa` (L115)                                  | EBITDA | Sí | Sí | OK |
| `totalInterest`    | Σ `interest` (L118)                                       | Gasto financiero | Sí | Sí | OK |
| `totalTax`         | Σ `tax` (L120)                                            | Impuesto del período | Sí | Sí | OK |
| `netMargin`        | `netIncome / totalRevenue` (L122)                        | Margen neto | Sí | Sí, **AGREGADO**, no último mes | OK pero semántica dual vs `marginDelta` |
| `revenueGrowth`    | `pctChange(prev.revenue, last.revenue)` (L125)           | Crecimiento MoM (últimos 2 meses) | Volátil; preferible YoY | Sí | null si `prev.revenue=0` o sin `prev` |
| `marginDelta`      | `(netMarginLast - netMarginPrev) × 100` pp (L132-134)     | Delta de margen neto MoM en pp | Sí | **No coincide con `netMargin`** del snapshot: usa `last.revenue-last.expenses` (gastos brutos, no net income) → si hay interés+impuestos ya cargados en `expenses`, las dos fórmulas tratan impuestos distinto | HIGH |
| `cashPosition`     | `fin(last.cash)` (L138)                                    | Caja al cierre | Siempre | Sí | OK |
| `monthlyBurn`      | `mean(últimos 6 de expenses - revenue)` (L140)           | Burn neto mensual medio (6 meses) | Sí | Sí, **pero para empresas rentables el burn es positivo** → `runwayMonths` se anula | MEDIUM |
| `runwayMonths`      | `cashPosition / |monthlyBurn|` si `burn < 0` (L142-144)   | Runway en meses | Sí | Sí, fail-closed: empresa rentable → `null` (no runway) | HIGH en UX |
| `currentAssets`    | `sumOrNull([cash, ar, inventory])` (L158)                | Activo corriente | Sí | Sí | Null si falta componente (fail-closed) |
| `currentLiabilities`| `sumOrNull([ap, shortDebt])` (L160)                      | Pasivo corriente | Sí | Sí | OK |
| `currentRatio`     | `currentAssets / currentLiabilities` (L162)              | Liquidez corriente | Sí | Sí | OK |
| `quickRatio`       | `(currentAssets - inventory) / currentLiabilities` (L164)| Liquidez inmediata | Sí | Sí | OK |
| `workingCapital`   | `currentAssets - currentLiabilities` (L166)              | Capital de trabajo | Sí | Sí | OK |
| `debtToEquity`     | `(currentLiab + longDebt) / equity` (L168)               | Apalancamiento | Sí | Sí (pasivo total / patrimonio) | OK |
| `dso`              | `(ar / last.revenue) × 30` (L172)                         | Days Sales Outstanding | Sí | Sí, mes-base (no anual) | OK |
| `dpo`              | `(ap / last.expenses) × 30` (L174)                        | Days Payable Outstanding | Sí | **Estándar**: DPO = `AP / COGS`, no `AP / total expenses`. Acá usa `expenses` totales | LOW |
| `periodStart`      | `data[0].month` (L235)                                    | Inicio del período | Sí | — | OK |
| `periodEnd`        | `last.month` (L236)                                       | Cierre del período | Sí | — | OK |

### Hallazgos KPI

| # | Sev | Descripción | Línea | Recomendación |
|---|-----|-------------|-------|---------------|
| 2.1 | **HIGH** | `netMargin` agregado vs `marginDelta` MoM: en el mismo snapshot el `netMargin` se calcula sobre `totalRevenue - totalExpenses` (período) pero `marginDelta` usa `(last.revenue - last.expenses)/last.revenue - (prev.revenue - prev.expenses)/prev.revenue`. Las dos cosas no son deltas de la misma magnitud (la segunda no incluye interés+tax diferenciado de OpEx). Dashboard muestra ambas tarjetas lado a lado → el CFO puede confundirse. | L122 vs L128-134 | Unificar: o bien todo agregado, o bien todo MoM. Aclarar `netMarginLast` consumiendo el `netMargin` real (incluyendo interés+tax como en la NIF/IFRS). |
| 2.2 | **HIGH** | Historial con `revenue > expenses` (empresa rentable) → `monthlyBurn > 0` → `runwayMonths = null`. La tarjeta "Cash runway" del Dashboard renderiza `—` permanentemente para el sample dataset, contrarrestando el claim comercial "Financial overview". | L142-144 | Exponer un KPI complementario "Cash coverage" (`cashPosition / mean(expenses)` → meses de cobertura de gastos aunque no haya burn). Mostrar el `null` con label "n/a (positive cash flow)". |
| 2.3 | MEDIUM | `monthlyBurn` usa `MathUtils.mean` que devuelve `0` si no hay valores finitos (no `null`). Enmascara missing data rompiendo el patrón fail-closed del resto del módulo. | L140 | Sustituir por función que propague `null` si algún mes de los últimos 6 no tiene dato finito. |
| 2.4 | MEDIUM | `netMarginLast`/`netMarginPrev` usan `(revenue - expenses)`, NO la definición IFRS de `Net Income`. Para meses con `expenses` que no incluyen `interest`/`tax` (porque el subdesglose viene aparte), esto infla el margen. | L128-130 | Calcular `(revenue - cogs - opex - daa - interest - tax)/revenue` cuando hay desglose. |
| 2.5 | MEDIUM | `pctChange` solo protegge `prev=0`. Para series con `prev<0` (revenue negativo por devoluciones) `pctChange` devuelve cambios no interpretables. Implementación actual es correcta según estándar, pero el KPI se etiqueta `revenueGrowth` como si siempre fuese válido. | L60-63 en MathUtils | Marcar `revenueGrowth=null` cuando `prev<0` o cuando `prev || curr` no son finitos positivos. |
| 2.6 | MEDIUM | `emptySnapshot()` mezcla `0` (`totalRevenue`, `totalExpenses`, `cashPosition`, `totalOpex`, ...) y `null` (más ratios). Una UI que muestre `0` para revenue y `—` para grossMargin puede inducir a pensar "hubo ingresos pero no margen"; realmente es todo un snapshot vacío. | L33-68 | `emptySnapshot()` debería devolver `null` en absolutamente todos los campos, o bien un flag `isEmpty: true` que el UI use para mostrar un EmptyState. |
| 2.7 | LOW | `DPO` denomina por `expenses` (gastos totales). Estándar contable usa `COGS` (o `purchases`). Produce DPO algo más bajo de lo real si OpEx >> COGS. | L174 | Cambiar denominación a `totalCogs` y dejar `null` cuando no hay COGS (más alineado a GAAP/IFRS). |
| 2.8 | LOW | `_action()` ID con `Date.now() + Math.random()` no es determinista ni reproducible para auditoría. (Tocado de nuevo bajo §7.) | n/a | Pasar a `crypto.randomUUID()` o secuencia monotónica por sesión. |
| 2.9 | INFO | `netIncome` agregado no se reconcilia con `cogs + opex + daa + interest + tax`: si viene del CSV desglosado, no hay aserción `totalExpenses === totalCogs + totalOpex + totalDaa + totalInterest + totalTax`. | L93 + L98-120 | Añadir reconciliación opcional (warning al usuario si los componentes no cuadran con `expenses`). |

### Edge cases
- División por 0: cubierta por `safeDivide` (L30, L66 MathUtils) → null.
- Valores nulos: cubiertos vía `divide` (L30) y `sumOrNull` (L21) → null.
- Negativos: `pctChange` con `prev=0` ya devuelve `null`; con `prev<0` no. Low.
- Series vacía: `emptySnapshot()` (L82).
- Series con 1 fila: funciona (prev es `undefined` → `revenueGrowth=null`, balances usan `last`).

---

## 3. CashFlowService — `src/services/financial/CashFlowService.js`

### Resumen
| Método | Función | Comentario |
|--------|---------|------------|
| `monthlyNetFlow` | `revenue - expenses` por mes (L9-15) | Método directo simplificado. **No hay categorías** (operating/investing/financing). |
| `cumulative` | acumulado de `cash + revenue - expenses` (L22-29) | Sólo operating. |
| `stressTest` | 13-week proyección bajo shock (L42-61) | Modelo de cobros deficiente (ver 3.2). |
| `averageNetFlow` | media móvil 3m por defecto (L64-67) | OK. |

### Hallazgos

| # | Sev | Descripción | Línea | Recomendación |
|---|-----|-------------|-------|---------------|
| 3.1 | **HIGH** | El servicio solo implementa el método **directo y simplificado** (`revenue - expenses`). No hay separación en **operating / investing / financing**, ni **Free Cash Flow** (no Capex, no financiamiento). El usuario lo mira esperando un STATE47 cash flow statement y obtiene apenas un net cash per month. | L7-67 | Construir `CashFlowService.fromMonthly` con 3 categorías y `freeCashFlow = operating - capex`. Pedir campo `capex` en el uploader. |
| 3.2 | **HIGH** | `stressTest` aplica la curva `1 - exp(-w/DSO_weeks)` a `weeklyRevenue` **cada semana**, sin modelar el inventario de cuentas por cobrar. Multiplica los ingresos futuros por la fracción de curva, de modo que nunca se "cobran" receivables viejas; cada semana se añade revenue recién generado × curva. Geométricamente erróneo: como la curva tiende a 1 para `w → ∞`, hacia el final de las 13 semanas el "collected" iguala al "weeklyRevenue" incurrido, no el acumulado de AR. | L52-57 | Mantener un estado `pendingAR` y cada semana mover `pendingAR += weeklyRevenueIncurrido; collected = pendingAR * (Δwave de curva); pendingAR -= collected`. |
| 3.3 | MEDIUM | `monthlyNetFlow` y `cumulative` usan `(d.revenue \|\| 0) - (d.expenses \|\| 0)` (coerce `undefined` a 0). Esto rompe el patrón fail-closed que el resto de servicios defiende: si falta `revenue` o `expenses` en un mes, se cuenta como 0 y se acumula. | L13, L26 | Propagar NaN/null como el resto; o documentar que este servicio sí admite missing data. |
| 3.4 | MEDIUM | `stressTest` no valida que el input tenga al menos 1 fila antes de `series[series.length-1]` (lo hace, L45). Pero no valida que `last.cash`, `last.revenue`, `last.expenses` sean finitos; usa `\|\| 0` que convierte NaN en 0 silenciosamente. | L48-50 | Aplicar `Number.isFinite` y devolver `null` cuando falten entradas. |
| 3.5 | INFO | Conversión mensual → semanal: `(monthly × 12) / 52 ≈ monthly × 0.2308` es la semana promedio del mes (52/12 ≈ 4.345 semanas/mes). Financieramente correcto. | L49-50 | Solo documentar la convención para evitar futuras "correcciones" mal entendidas. |

---

## 4. ForecastingService — `src/services/financial/ForecastingService.js`

### Resumen
- Modelo: `value = (slope*i + intercept) × seasonalFactor[MM]`, lineal (mínimos cuadrados).
- Intervalo de predicción: `band = sigma × t_{0.975, dof} × √(1 + 1/n + (i-meanX)²/Sxx)`, con `Sxx = n(n²-1)/12` correcto.
- Backtest: trunca los últimos `horizon` meses y compara.

### Hallazgos

| # | Sev | Descripción | Línea | Recomendación |
|---|-----|-------------|-------|---------------|
| 4.1 | **HIGH** | `MIN_POINTS = 5` y el guard `-backend-return EMPTY_FORECAST` están bien. Sin embargo, con **1 observación** el guard es cubierto (n<5 → vacío), pero la API **NO explica al usuario por qué** hay un vacío: devuelve `method:'insufficient-data'` que el UI muestra tal cual sin feedback de "necesitas al menos 5 meses". | L82-89 | Devolver `{reason: 'min_points'}` y mostrar mensaje en `Forecast.jsx` con el umbral explícito. |
| 4.2 | **HIGH** | `backtest` requiere `n ≥ MIN_POINTS + horizon`. Para `horizon=12` (botón "12m" del UI) y sample `n=12` → `12 < 5+12` → vacío (todo 0). UI no lo invoca pero si se compone más adelante el backtest no es significativo para series mensuales cortas. Tampoco devuelve la causa al usuario. | L184 | Devolver `{reason:'insufficient-actuals'}` y mostrar mensaje. Decrementar horizon automágento hasta `horizon ≤ n-MIN_POINTS`. |
| 4.3 | MEDIUM | Estacionalidad degenerada: con el sample dataset de 12 meses en 1 año, cada mes calendario tiene **1 sola observación** → `count < 2` → factor = 1.0 ⇒ la "seasonality" no se aplica nunca. El docstring ya lo admite explícitamente, pero el método declarado es `'linear-trend + monthly seasonality'` aunque la seasonality esté inactiva. Para activarla se necesitan **≥ 2 años** de histórico. | L17-22, L114, L116-121 | Si data.length < 2 años, devolver `method:'linear-trend (no seasonality: insufficient cycles)'`. Avisar al UI. |
| 4.4 | MEDIUM | `linearTrend` no resiste outliers. Un único mes atípico (grande o pequeño) mueve la recta entera y deforma la seasonality. No hay winsorización ni robust regression. | MathUtils L45-57 | Detectar outliers con `AnomalyService` previo a la regresión, o aplicar Theil-Sen / RANSACK simple. |
| 4.5 | INFO | `expectedGrowth = pctChange(last[metric], points[0].value)` puede ser negativo o nulo (si `last[metric]=0`). El `0` final substituye a null. En `AgentOrchestrator` se compara `< 0`. Comportamiento aceptable. | L155-157 | OK pero documentar que `expectedGrowth = 0` puede significar "sin cambio" o "no calculable". |
| 4.6 | INFO | `studentTQuantile(1)` devuelve 4.303 (que es el valor dof=2) — falseado para dof=1 (debería ser 12.706). Pruuebas con `n=3` → `dof=1` están mal acotadas. En el flujo estándar `n≥5` ⇒ `dof≥3` ⇒ tabla correcta. | MathUtils L79 | Anadir `1: 12.706` a la tabla. |
| 4.7 | INFO | Coverage de backtest usa `points[i].lower`/`upper` del forecast que se acaba de sobre los datos truncados — la banda es un intervalo de predicción valido. OK metodológicamente. | L217 | OK. |

---

## 5. BenchmarkService — `src/services/financial/BenchmarkService.js`

| # | Sev | Descripción | Línea | Recomendación |
|---|-----|-------------|-------|---------------|
| 5.1 | MEDIUM | `customerAcquisitionCost` y `lifetimeValue` son **siempre `null`** en V2/FASE 0 (`companyFrom: () => null`). Las filas aparecen en pantalla pero `status='unknown'` permanente. El usuario ve métricas que la app nunca podrá comparar → ruido UI. | L43-44 | Ocultar CAC/LTV hasta tener integración de CRM/cobranzas. Documentar como roadmap explícito. |
| 5.2 | MEDIUM | El shim de V2 (`if (benchmarks == null && !looksLikeKpis(kpis))`) funciona pero es frágil: se basa en dos `Object.prototype.hasOwnProperty` checks en el snapshot KPI (`periodStart` O `cashPosition`). Si un futuro caller pasa un snapshot parcial sin esos keys, el shim lo trata como benchmark. | L48-53, L66-70 | Reemplazar por API explícita `compareKpis(kpis, benchmarks)` vs `compareSeries(series, benchmarks)` y deprecar el autodetect. |
| 5.3 | INFO | Los benchmarks de `INDUSTRY_BENCHMARKS` (`grossMargin 0.52`, `netMargin 0.18`, `currentRatio 1.8`, `debtToEquity 0.6`, `cashRunway 12`, `revenueGrowth 0.15`, `operatingMargin 0.22`, `CAC 850`, `LTV 12500`) son puntos únicos para SaaS B2B mid-market. Razonables pero sin industry tier (SMB vs enterprise) ni bandas temporales. Rangos finos de benchmark no se validan. | datasets.js L103-113 | Convertir benchmarks a rangos `{ p25, p50, p75 }` por industria y tamaño de empresa. |

---

## 6. CovenantService — `src/services/financial/CovenantService.js` + `Forecast.jsx`

### Estados Covenant
| status      | Cuando                                                                       | Significado negocio                                  |
|-------------|------------------------------------------------------------------------------|------------------------------------------------------|
| `passed`    | `operatorFn(actual, threshold)` true                                         | Cumple la cláusula                                  |
| `breach`    | `severity==='critical'` Y no cumple                                          | Incumplimiento crítico → notifica al prestamista   |
| `warning`   | `severity` no crítico (`warning`/`info`) Y no cumple                         | Advertencia                                         |
| `unknown`   | `actual` nulo o no numérico, o `operator` no soportado                       | Dato no disponible (fail-closed)                    |

### Covenants del sample (`datasets.js`)
| id  | metric          | operator | threshold | severity | ¿Espera period? | ¿Espera KPI? |
|-----|-----------------|----------|-----------|----------|-----------------|--------------|
| c1  | `cash`          | `>=`     | 1.5M      | critical | sí ✓            | sí (fallback) |
| c2  | `debtToEquity`  | `<=`     | 1.0       | warning  | no              | sí (KPI)    |
| c3  | `currentRatio`  | `>=`     | 1.5       | warning  | no              | sí (KPI)    |
| c4  | `revenueGrowth` | `>=`     | 0.10      | info     | no              | sí (KPI)    |

### Hallazgos

| # | Sev | Descripción | Línea | Recomendación |
|---|-----|-------------|-------|---------------|
| 6.1 | **BLOCKING** | `Forecast.jsx` invoca `CovenantService.evaluate(MONTHLY_FINANCIALS[last], COVENANTS)` **sin tercer arg**, por lo que `kpis=null` en `resolveMetric`. Las métricas `debtToEquity`, `currentRatio`, `revenueGrowth` **no existen como campo en el registro mensual** (son calculadas por KPICalculator), de modo que `resolveMetric` devuelve siempre `null` → `status='unknown'` permanente. Sólo c1 (`cash`) se evalúa. El panel "Covenant monitoring" muestra 3/4 filas como "unknown" sin que el usuario entienda por qué. | `Forecast.jsx:27`; `CovenantService.js:34-38` | Pasar el snapshot KPI: `CovenantService.evaluate(last, COVENANTS, KPICalculator.fromMonthly(MONTHLY_FINANCIALS))`. Mostrar `unknown` con un tooltip explicativo "metric not available in current period". |
| 6.2 | HIGH | El covenant c1 usa `metric='cash'` (literal). Pero el snapshot KPI también expone `cashPosition`. `resolveMetric` prioriza `period[metric]` antes que `kpis[metric]`. Si el uploader mapea la columna a `cashPosition` y no a `cash`, c1 nunca se resuelve desde el registro. | L34-38 | Aceptar alias (`cash`, `cashPosition`) o exponer el campo del snapshot como source of truth. |
| 6.3 | INFO | El `== 'info'` severity provoca `warning` pero el campo `severity` en `datasets.js` no está expuesto al usuario (UI solo muestra `status`). El matiz "info vs warning" se pierde. | Forecast.jsx L114 render solo `status` | Añadir icono/tooltip para `severity`. |
| 6.4 | INFO | `EventBus.emit('covenant.breach', ...)` dispara pero no hay suscriptor en runtime (NotificationService no se acopla en estas páginas). El breach se computa pero no se alerta. | L72-79 | Subscribirse en `useAgentManager` o un `useCovenantAlerts`. |

---

## 7. AgentOrchestrator + useAgentManager

### Capabilities (enumeradas en `CAPABILITIES`)
1. `REALLOCATE_BUDGET`
2. `ADJUST_FORECAST`
3. `TRIGGER_CASH_SWEEP`
4. `ESCALATE_COVENANT`
5. `INVESTIGATE_REVENUE_DECLINE`

### Condiciones de disparo
| Capability | Trigger | Línea |
|------------|---------|-------|
| `TRIGGER_CASH_SWEEP` | `kpis.runwayMonths != null && runwayMonths < 6` | L50-57 |
| `ADJUST_FORECAST` | `kpis.netMargin < 0` | L59-66 |
| `INVESTIGATE_REVENUE_DECLINE` | `revenueAnomalies.length>0` (anomalía con `score<0`) **O** `revenueGrowth < -0.10` | L68-84 |
| `ESCALATE_COVENANT` | `covenantStatus.breaches.length > 0` | L86-93 |
| `REALLOCATE_BUDGET` | `forecast.expectedGrowth < 0` | L95-102 |

### Fail-closed
- L39-41: sin `capabilities` explícito, no propone nada → OK.
- L34-36: sin `series`, no propone → OK.
- `INVESTIGATE_REVENUE_DECLINE`: adjunta `evidence` (KPI + ref) y `hypotheses` (3 primeros de pipeline/churn/pricing/vendor/product_mix/macro). **Siempre las mismas 3 hipótesis** sin correlación con la data → "no inventa causalidad" pero tampoco propone nada dinámico.

### Hallazgos

| # | Sev | Descripción | Línea | Recomendación |
|---|-----|-------------|-------|---------------|
| 7.1 | HIGH | Las condiciones comparan `kpis.netMargin < 0` (agregado del período) sin distinguir "último mes negativo" vs "período completo negativo". Una empresa con año positivo pero último mes rojo no dispara ADJUST_FORECAST. Inverso: una empresa con año negativo compensado por un buen mes dispara incluso si ya se corrigió. | L59 | Usar `last.revenue - last.expenses < 0` (mes actual) como trigger corto y `kpis.netMargin` como smell corto del agregado; dos capacidades distintas si conviene. |
| 7.2 | HIGH | `useAgentManager` emite `agent.approved` y `agent.rejected` a EventBus, pero el UI donde se integran es **no existe** en estas páginas. Neither `Dashboard.jsx` ni `Forecast.jsx` utilizan `useAgentManager`; no aparece `pending` / `approved` en pantalla. El agente está "caliente" (se puede disparar programando desde el hook) pero no hay UI para invocarlo, aprobarlo o verlo. La "autonomía" prometida no está conectada. | `useAgentManager.js` (sin consumers en `pages/`) | Añadir panel "Agent activity" en Dashboard/Forecast. Renderizar `pending`, `approved`, `summary`. |
| 7.3 | LOW | `_action` IDs usan `Date.now() + Math.random()` → no reproducible en logs de auditoría. | L121-124 | Pasar a `crypto.randomUUID()` o secuencia monotónica por sesión. |
| 7.4 | INFO | El reporte es inglés técnico ("Cash runway is 5.4 months — below the 6-month safety threshold."). El `rationale` es entendible para un CFO, no para un usuario no técnico. | L52-103 | Ofrecer `rationale` + `rationaleSimple` (traducido, sin jerga) por i18n. |
| 7.5 | INFO | `autoRun` solo reacciona a cambios de `autoRun`, no a cambios de `series`. Si el dataset cambia (cuando exista uploader), `useEffect([autoRun])` no vuelve a disparar. | useAgentManager.js L59-62 | Añadir `series` a las deps o re-run on key change. |

---

## 8. Datos de ejemplo — `src/data/datasets.js`

| Dimensión             | Aprox. en sample                 | Comentario                                            |
|-----------------------|----------------------------------|-------------------------------------------------------|
| Sector                | SaaS mid-market                  | Declarado en `COMPANY_PROFILE.industry='SaaS'`        |
| Revenue               | 420k → 815k USD (≈ +94% YoY)     | High-growth; growth ≥ covenant `0.10` todo el año    |
| Expenses              | 310k → 495k USD                  | Margen neto agregado ≈ 38%                            |
| Cash                  | 1.25M → 3.54M USD                | Acumulado muy elevado (empresa rentable)              |
| COGS                  | ~38% revenue                     | GM ≈ 62% consistentes con SaaS con costos de hosting |
| OpEx                  | decreciente como %               | SaaS maduro inclinándose a economía de escala        |
| D&A                   | 15k → 24k creciente              | OK                                                    |
| Interest              | 6.0k → 5.4k decreciente          | Larga deuda 600k→480k (≈10k/mes amort.)              |
| Tax                   | 25% de pre-tax                   | OK US federal ≈ 21% + state; algo alto               |
| AR                    | revenue × 1.2 (≈36 días DSO)    | OK SaaS net-60 si se netean clauses                  |
| Inventory             | 30k → 48k                        | Bajo para SaaS (presumably swag/credit)               |
| AP                    | expenses × 0.30                  | OK                                                    |
| LongDebt              | 600k → 480k                      | OK                                                    |
| Equity                | 1.6M → 3.9M (retenidas incl.)   | OK                                                    |

### Hallazgos

| # | Sev | Descripción | Línea | Recomendación |
|---|-----|-------------|-------|---------------|
| 8.1 | HIGH | Datasets **rentable** ⇒ `runwayMonths=null` permanente ⇒ Dashboard "Cash runway" siempre `—`, anomalía de burn nunca disparada, c1 cash siempre encima del threshold (covenant pasa). La demo no permite verificar el flujo "empresa en riesgo" que es el caso de uso principal del agente autónomo. | L28-101 | Proveer un segundo dataset (`MONTHLY_FINANCIALS_DISTRESSED`)ammes con burn para demostrar el agente y runway. |
| 8.2 | MEDIUM | 12 meses en UN solo año calendario (2025). Cada mes calendario tiene 1 observación → la estacionalidad del `ForecastingService` queda degenerada. La "monthly seasonality" del método nunca se ejercita. | L28-101 | Proveer dataset de 24-36 meses para que la seasonality sea testeable. |
| 8.3 | INFO | La invariante contable `cash + ar + inventory + fixedAssets = ap + shortDebt + longDebt + equity` ya se documenta en L23-26; verificado manualmente para 2025-01: 1250000 + 504000 + 30000 + 599000 = 2.383.000 = 93000 + 80000 + 600000 + 1610000 = 2.383.000 ✓. OK. | L28-101 | OK. |

---

## 9. Consistencia de datos entre páginas

| # | Sev | Descripción | Ubicación | Recomendación |
|---|-----|-------------|-----------|---------------|
| 9.1 | **BLOCKING** | Cada página importa `MONTHLY_FINANCIALS` directamente. No existe `DataContext`, ni store, ni hook compartido. Resultado: (a) cambiar Settings (perfil, moneda, frecuencia) no afecta a Dashboard/Forecast; (b) si en el futuro se carga un CSV desde una página, las otras no lo verán sin recargar. | `Dashboard.jsx:13`, `Analysis.jsx:14`, `Forecast.jsx:15`, `Settings.jsx:11` | Crear `useFinancialData` hook + context para serie+perfil+covenants+benchmarks, todos persistidos en localStorage. |
| 9.2 | **BLOCKING** | `Settings.jsx` "Save profile" button **no tiene `onClick`** → el formulario no persiste el perfil. El `useState` strict-local se pierde al navegar. | `Settings.jsx:64` | Wirear `onClick` que persista al store (ver 9.1). |
| 9.3 | HIGH | `formatters.js` hardcode `currency: 'USD'`. Cambiar `profile.currency` a `EUR` no altera cómo Dashboard/`MetricCard` formatea los importes. Sistema "moneda única" inutiliza el campo. | `formatters.js:4-9` | Cargar `currency` del store y construir `Intl.NumberFormat` dinámico; exponer `fmt.currency(v, { currency })`. |
| 9.4 | HIGH | KPIs computados en Dashboard vía `KPICalculator.fromMonthly(MONTHLY_FINANCIALS)` y en Analysis vía `BenchmarkService.compare(series, benchmarks)` internally re-ejecuta `KPICalculator`. La KPI compatible de V2 calcula con el mismo input → resultados idénticos, **pero se calcula dos veces** (pérdida de memo cache) y, peor, si el input diverge (cuando exista uploader), cada página lo calculará con un snapshot `.filter` independiente (en KPICalculator L81). | `Dashboard.jsx:21`, `Analysis.jsx:25` | Centralizar en context: el snapshot KPI se calcula una sola vez y se reutiliza. |
| 9.5 | MEDIUM | `Forecast.jsx` re-forecast sólo cuando cambia `horizon`. No recomputa covenantStatus cuando `MONTHLY_FINANCIALS` cambia (cuando exista uploader). `useMemo([])` con deps vacías. | `Forecast.jsx:26-29` | Añadir dependencia a `series`/kpis. |
| 9.6 | INFO | `Analysis.jsx` invoca BenchmarkService con `compare(series, benchmarks)` (modo V2 compat). El modo V3 `compare(series, kpis, benchmarks)` no se usa en runtime, aunque la API esté testeada. | `Analysis.jsx:25` | Migrar a API V3 una vez exista context con kpis pre-calculados. |

---

## 10. Edge cases críticos

| # | Sev | Descripción | Recomendación |
|---|-----|-------------|---------------|
| 10.1 | HIGH | CSV con 10.000 filas: el `BarChart` no virtualiza (mira `src/components/charts/BarChart.jsx` mode no confirmado en este audit; sin virtualización de seguridad). Dashboard render tendría 10k+ bars → performance crippling, posiblemente crash del browser. | Virtualizar series largas ( windowing) y / o aggregate por trimestre cuando `n > 36`. |
| 10.2 | HIGH | Cambiar moneda vía Settings: ver 9.3 (no efecto). Además `monthlyBurn`, `cashPosition`, `totalRevenue` se mostrarían con prefijo `$` mientras el usuario escogió EUR — inconsistency visible. | Aplicar formatters dinámicos a `MetricCard` via `format="currency"` parametrizable. |
| 10.3 | HIGH | Recarga de página: todo el state UI (perfil editado, capabilities toggleadas en Settings, horizon seleccionado en Forecast) se pierde — no hay `localStorage`. El usuario se siente "lejos" del SaaS prometido. | Persistir todo lo no sensible a `localStorage` y rehidratar en boot. |
| 10.4 | INFO | Errores de red: no existe capa API actualmente (no `fetch`/`axios` en `src/services`). El "Accounting connector: Not connected" en Settings es está design-only. Es "infalible" hoy; cuando se integre API real, implementar retry/backoff + estado de error visible. | Construir capa de `api/` con interceptores y un `useNetworkStatus` que visualice conectividad. |

---

## Mensaje final — resumen de acciones prioritarias

| Orden | Severidad | Hallazgo | Acción inmediata |
|:----:|:---------:|----------|------------------|
| 1 | BLOCKING | 1.1 + 1.2 | Implementar uploader de CSV real; `Modal.jsx` no es el uploader. |
| 2 | BLOCKING | 1.3 + 6.1 + 9.1 + 9.2 | Crear `DataContext` con persistencia en `localStorage` y unificar cómo todas las páginas consumen la serie y los KPIs. Pasar el snapshot KPI a `CovenantService.evaluate` para que covenants c2/c3/c4 se evalúen. |
| 3 | BLOCKING | 6.1 | `Forecast.jsx` alimenta `CovenantService` con el snapshot KPI; hoy 3 de 4 covenants siempre son `unknown`. |
| 4 | HIGH | 2.1 + 2.2 | Aclarar semántica agregada vs MoM de netMargin/marginDelta y mostrar "n/a" con copy cuando runway no aplica por flujo positivo. |
| 5 | HIGH | 3.1 + 3.2 | Reconstruir `CashFlowService.stressTest` con estado `pendingAR`, y añadir `operating/investing/financing` + `freeCashFlow`. |
| 6 | HIGH | 4.1 + 4.2 + 7.1 + 7.2 | Devolver `reason` cuando forecast/backtest se saltean por datos insuficientes; corregir trigger de `ADJUST_FORECAST` a último mes; construir UI del agente (`agent activity` panel). |
| 7 | HIGH | 8.1 | Proveer segundo dataset "distressed" para demostrar runway, covenant breach y agente autonomía. |
| 8 | HIGH | 9.3 + 10.2 | `formatters.js` parametrizable por moneda. |
| 9 | HIGH | 10.3 | Persistencia UI en localStorage. |
| 10 | MEDIUM | 2.7 + 4.3 + 5.1 + 5.2 + 9.5 | Lotes de consistencia: DPO por COGS, truncar horizon automático, ocultar CAC/LTV en V2, deprecar shim por API explicita, ajustar deps de useEffect en Forecast. |

## Cierre del protocolo

### Descubrimientos
- La lógica financiera "core" (KPICalculator y ForecastingService con t-Student) está sólida matemáticamente y respeta el principio fail-closed.
- Sin embargo, **la capa de presentación no conecta con la capa de servicios** salvo degradada: covenant panel inerte (3/4 unknown), agent hook huérfano, formatters hardcoded, settings sin persistir, demo dataset unidimensional.
- **No existe uploader de CSV en absoluto** pese a ser el claim de marketing.

### Entregables
- `C:\Users\jairo\Documents\aplicacion financiera\files\afde-complete-v2\afde-complete\docs\business\contexto.md`
- `C:\Users\jairo\Documents\aplicacion financiera\files\afde-complete-v2\afde-complete\docs\business\hallazgos.md` (este archivo)

### Dudas abiertas
- ¿Hay un spec contractual más reciente (`finflow-v3-architecture.spec.md`)? Se referencia en código pero no está auditado aquí.
- ¿Está planificada la integración del agente en UI? Es plausible que sea roadmap y no bug.
- ¿Se prevee que el sample dataset sea rentable por design? Affects interpretación del "Cash runway" vacío.

### Agente sugerido a continuación
- **Product Manager** para priorizar el backlog (BLOCKING < HIGH < MEDIUM) y secuenciar el uploader, el DataContext y el panel del agente.
- **Software Architect** después, para diseñar el `DataContext`/store con persistencia y puentear el shim V2 de BenchmarkService.
- (Opcional) **Financial Analyst** para validar fórmulas de DPO/FCF/seasonality antes de tocar servicios.

No se implementó código. No se modificó ningún artefacto de producción. Solo lectura + escritura de hallazgos en `docs/business/`.