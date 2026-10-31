# Crecimiento · implementación conjunta

Desarrollo local de las fases 2–5, 31 de octubre de 2026. La producción anterior es web 2.5.0 / Android 1.2.0. Por instrucción del titular, no se publican fases intermedias: la candidata conjunta es web 2.6.0 / Android 1.3.0, código 5. Su distribución requiere completar la comprobación del nuevo artefacto y del paquete web.

## Recorridos conectados

La web añade «Planificar» a su navegación. En Expo se abre desde Más → Planificar recurrentes, deudas y patrimonio. Ambas interfaces utilizan `planning-editor.mjs`, que comparte campos, validaciones y operaciones sin ejecutar escrituras al cambiar un campo. Guardar espera la confirmación del almacenamiento; un error conserva el formulario y el estado anterior.

| Fase | Implementación y evidencia |
| --- | --- |
| Personal · CR-07–12, 26–27 | Plantillas semanales/mensuales/anuales, fin de mes sin deriva y años bisiestos; confirmar ocurrencias conserva un ID estable incluso al archivar. Deudas con capital, interés y comisión separados; abonos nuevos o vinculados, historial y desvinculación que conserva movimientos. Patrimonio con valoraciones fechadas, efectivo contado una vez y deudas derivadas. Presupuestos por categoría/mes, herencia de los límites antiguos y comparación sin porcentajes inventados cuando falta referencia. |
| Empresa · CR-13–17 | Agenda de cobros/pagos, fechas previstas explícitas, parciales, anulación y vínculos únicos. Caja de 13 intervalos de siete días; tabla, barras y evidencia utilizan las mismas partidas. Escenarios de atraso/coste/ingreso no alteran la base. El modelo anterior de resistencia permanece identificado como aproximación mensual. Forecast/backtest conservan mínimos de historial, rechazan huecos y exponen ventanas y errores por mes. |
| Profesional · CR-18–21 | Clientes activos/archivados, datos incompletos identificados, portafolio separado por moneda e informes individuales con registros y supuestos. Las alertas se evalúan por espacio, con preferencias de frecuencia, revisión y descarte por condición. No conceden acceso remoto a cuentas de terceros ni generan operaciones o mensajes. |
| Sostenibilidad · CR-22–23 | Política y espacios de patrocinio opcional en pie de landing y aprendizaje. Sin proveedor ni SDK activo, sin solicitudes publicitarias. El piloto CR-25 es condicional y queda desactivado hasta elegir condiciones/proveedor y comprobar aislamiento/rendimiento. Véase [SPONSORSHIPS.md](SPONSORSHIPS.md). |

## Contrato y límites financieros

`Workspace.planning` es opcional. Contiene `recurrences`, `debts`, `assets`, `liabilities`, `budgets`, `dues` y `alerts`; cada colección admite hasta 500 registros, cada deuda/partida hasta 500 vínculos y las preferencias hasta 1.000 descartes. Los respaldos completos conservan el formato v2, identidad, datos de ejemplo y campos adicionales. La validación comprueba fechas, cantidades, identificadores y que los pagos concilien con movimientos activos de ese mismo espacio. El archivo de un movimiento vinculado requiere retirar primero su vínculo; desvincular no borra el movimiento.

Declarar una deuda no crea un ingreso. Los desembolsos se registran explícitamente como capital en Movimientos. En los abonos, el capital se clasifica como capital, el interés como interés y la comisión como gasto operativo declarado sin inferir comportamiento fijo/variable. La simulación de cuotas utiliza una tasa nominal anual supuesta dividida entre doce, redondea las cuotas y ajusta la última; no representa condiciones contractuales, seguros o comisiones desconocidas.

La tasa de ahorro personal usa los ingresos y gastos registrados excluyendo capital y depreciación; conserva intereses, comisiones e impuestos registrados como gastos. La caja y el margen empresarial sí incluyen entradas y salidas de capital. Es una medida operativa de los registros, dependiente de su clasificación, no una reproducción de estadísticas nacionales. La distinción entre ahorro y financiación sigue el criterio de [BEA sobre ahorro y amortización de pasivos](https://www.bea.gov/help/faq/65). La prueba de 1.000 de ingreso, 2.000 de préstamo, 400 de gasto y 300 de amortización obtiene ahorro de 600 (60%) y flujo de caja de 2.300.

Los presupuestos excluyen capital y depreciación. El cero específico de un mes significa cero gasto previsto y puede generar una señal; un antiguo límite cero mantiene su significado heredado de límite no activado. Los meses futuros con presupuestos o fechas de agenda aparecen en los selectores de período. Cambiar moneda conserva las cifras; no aplica tipos de cambio.

El patrimonio utiliza el saldo inicial configurado y los movimientos de caja hasta la fecha de corte, más activos declarados menos otros pasivos y capital pendiente de deudas. El importe reservado de las metas no se vuelve a sumar. Una valoración posterior al corte se excluye y marca el total incompleto; el saldo inicial ausente permanece desconocido. Las valoraciones no se presentan como cotizaciones actuales.

La caja semanal necesita un saldo inicial para la fecha elegida. Los movimientos registrados dentro del intervalo se incluyen una sola vez; los pagos vinculados reducen el pendiente de la agenda, sin duplicar el flujo. Empresa/asesor usan su agenda, mientras Personal usa recurrentes y vencimientos de capital. Para deudas se advierte que no se han inferido intereses futuros. Los vencidos sin fecha futura explícita quedan fuera hasta seleccionar el supuesto de llevarlos al inicio; cada escenario conserva y exporta esa decisión. Las cifras no equivalen a contabilidad de devengo ni a una promesa de cobro.

Los porcentajes del backtest no se calculan sobre reales cero. El error absoluto sigue disponible cuando corresponde. Sin historial suficiente, las métricas son `null`, con motivo explícito; nunca se presentan como un error perfecto de cero. El portafolio no suma monedas diferentes ni clientes archivados a los totales activos. Si falta información, muestra totales desconocidos y subtotales conocidos claramente identificados.

## Comprobaciones locales

Con los ajustes del SDK, los selectores de pagos existentes y la separación entre ahorro y capital pasaron 98 pruebas Vitest y 75 Node. El acceso PHP conserva sus seis pruebas correctas; lint mantiene cuatro advertencias previas y ningún error. TypeScript se comprueba también para el código móvil final. Se completó además el caso integrado: formulario compartido → recurrente confirmado dos veces → pago de deuda → cobro parcial → presupuesto → patrimonio → IndexedDB → respaldo portátil. Resultado conocido: caja 985 CLP, resultado 185 CLP, patrimonio 635 CLP y caja programada de cierre 1.685 CLP. La eliminación de un movimiento vinculado se rechaza antes de sustituir los datos guardados.

El titular pidió continuar sin revisión visual por ahora. No se atribuyen a esta entrega nuevas capturas, recorridos de clics, pruebas de tamaños, accesibilidad auditada ni métricas de rendimiento de campo. La instalación/apertura y el retorno de Google en Android físico, y Safari/iPhone actuales, siguen sin prueba en dispositivo. Los controles de fuente, tipos, compilación y contenido del APK no sustituyen esas comprobaciones. iOS nativo continúa condicionado a cuenta y firma Apple; la web instalable se conserva.

La distribución pública y la verificación del archivo servido se registrarán en [DISTRIBUTION.md](DISTRIBUTION.md) solo cuando hayan ocurrido. Las fases funcionales quedan separadas de ese control de entrega; no se marca CR-24 completo a partir de un build local.
