# Tareas · FinFlow Crecimiento

Estado al 30 de octubre de 2026. La lista se ejecuta por dependencias e hitos del [plan](plan.md); los identificadores no imponen orden numérico. Cada tarea incluye aceptación, verificación y archivos probables; los nombres de archivos nuevos son propuestas, no componentes existentes.

- [x] **CR-00 · Alinear la siguiente versión con la base publicada.**
  - Aceptación: diseño claro confirmado; brechas y procedencia registradas; V3 incompatible subordinada al nuevo alcance.
  - Verificación: inspección de entrada web, almacenamiento, importación, clientes y servicios; enlaces, matriz y diff revisados. No implica nueva prueba en teléfono.
  - Archivos: `docs/CRECIMIENTO.md`, `docs/adr/0011-crecimiento-evolutivo.md`, `docs/crecimiento-traceability.csv` y documentación de planificación.

- [x] **CR-01 · Definir contrato y migración compatible de datos.** Depende de CR-00.
  - Aceptación: esquema versionado independiente de plataforma; conserva identidades/monedas/IDs; acepta respaldo móvil v1 y datos web existentes sin mezclarlos.
  - Verificación: fixtures antiguos, campos ausentes/desconocidos y aislamiento en pruebas de contrato.
  - Archivos: nuevos `src/workspace/snapshot.mjs`, `tests/snapshot.test.mjs`; `mobile/src/data/model.ts`, `mobile/src/data/model.test.ts`.

- [x] **CR-02 · Exportar y restaurar respaldos completos.** Depende de CR-01.
  - Aceptación: incluye todo el espacio; preview y confirmación; cancelación/error conserva el anterior y restaurar recupera monedas/metas/configuración.
  - Verificación: exportar/restaurar en web y móvil, archivo corrupto y vuelta a fixtures v1; pruebas de contrato y TypeScript.
  - Archivos: `src/workspace/app.mjs`, `src/workspace/snapshot.mjs`, `mobile/src/data/model.ts`, `mobile/src/screens/forms.tsx`, `tests/snapshot.test.mjs`.

- [ ] **CR-03 · Migrar persistencia web con recuperación.** Depende de CR-02.
  - Aceptación: IndexedDB activo tras copia validada; migración repetible y fuente anterior conservada; fallo de cuota/transacción/otra pestaña muestra recuperación sin datos falsamente guardados.
  - Verificación: navegador real con datos sintéticos, recarga, aborto de escritura y cambio de cuenta; pruebas del contrato del adaptador.
  - Archivos: nuevos `src/workspace/storage.mjs`, `tests/storage.test.mjs`; `src/workspace/app.mjs`, `src/workspace/auth.mjs`.

- [ ] **CR-04 · Preparar importación sin escribir datos.** Depende de CR-01.
  - Aceptación: propuesta de lote con filas/errores/duplicados; límites actuales y parser conservados; lote inválido rechazado sin omisiones silenciosas.
  - Verificación: comillas, saltos de línea, Unicode, decimales, fechas inválidas, duplicados y cancelación.
  - Archivos: nuevo `src/workspace/import-review.mjs`, `tests/import-review.test.mjs`; `src/workspace/core.mjs`, `tests/core.test.mjs`.

- [ ] **CR-05 · Confirmar el CSV desde web y móvil.** Depende de CR-02/04.
  - Aceptación: preview visible antes de guardar; cancelar no escribe; confirmar dos veces no duplica y el espacio/moneda destino se identifica.
  - Verificación: recorrido en navegador de ambas interfaces, pruebas móviles de importación y TypeScript.
  - Archivos: `src/workspace/app.mjs`, `mobile/src/data/model.ts`, `mobile/src/screens/forms.tsx`, `mobile/src/data/model.test.ts`.

- [ ] **CR-06 · Crear clientes dinámicos en la web.** Depende de CR-01/02.
  - Aceptación: crear/nombrar/archivar/restaurar; conservar entidades anteriores; cliente vacío sin datos demo mezclados y separación por cuenta/moneda.
  - Verificación: crear un cuarto cliente, recargar y restaurar respaldo; aislamiento del resto y paridad con el modelo móvil existente.
  - Archivos: nuevo `src/workspace/clients.mjs`, `tests/clients.test.mjs`; `src/workspace/app.mjs`, `src/workspace/snapshot.mjs`.

**Comprobación de datos:** tras CR-01–06, ejecutar suites de contratos/finanzas, build y TypeScript; comprobar que un fallo de importación o almacenamiento conserva el estado anterior.

- [ ] **CR-07 · Calcular ocurrencias recurrentes revisables.** Depende de CR-01.
  - Aceptación: calendario con fin de mes/año bisiesto; plantilla separada del movimiento; ID de ocurrencia impide duplicados.
  - Verificación: casos día 31, febrero, pausa y confirmación repetida.
  - Archivos: nuevos `src/workspace/recurrences.mjs`, `tests/recurrences.test.mjs`; contrato y pruebas de snapshot.

- [ ] **CR-08 · Gestionar recurrentes desde ambos canales.** Depende de CR-02/07.
  - Aceptación: crear/editar/pausar plantilla; revisar próxima ocurrencia antes de registrar; preservar presupuestos y alertas del perfil.
  - Verificación: recorrido completo, recarga y respaldo; comparación entre movimientos y resumen.
  - Archivos: `src/workspace/app.mjs`, `mobile/src/screens/forms.tsx`, `mobile/src/screens/main.tsx` y hasta dos rutas/componentes nuevos.

- [ ] **CR-09 · Separar deuda, capital e intereses.** Depende de CR-01.
  - Aceptación: deuda y vencimiento explícitos; capital no se registra como ingreso/gasto de resultado; interés/comisión y pago real identificados sin duplicación.
  - Verificación: préstamo, amortización parcial, pago repetido y tasa desconocida; resultado y caja conciliados.
  - Archivos: nuevos `src/workspace/debts.mjs`, `tests/debts.test.mjs`; contrato y pruebas de snapshot.

- [ ] **CR-10 · Registrar y seguir deudas.** Depende de CR-02/09.
  - Aceptación: alta, saldo pendiente y calendario visibles; registrar/vincular pago; supuestos de simulación editables y no presentados como condiciones de un crédito real.
  - Verificación: mismo caso conocido en web/móvil, recarga, respaldo y clasificación en resultados.
  - Archivos: `src/workspace/app.mjs`, `mobile/src/screens/forms.tsx`, `mobile/src/screens/main.tsx` y hasta dos rutas/componentes nuevos.

- [ ] **CR-11 · Calcular patrimonio por espacio y moneda.** Depende de CR-01/09.
  - Aceptación: activos con fecha de valoración; pasivos vinculados; efectivo existente contado una vez y datos desconocidos identificados.
  - Verificación: efectivo más activo más deuda, datos ausentes y moneda distinta.
  - Archivos: nuevos `src/workspace/net-worth.mjs`, `tests/net-worth.test.mjs`; contrato y pruebas de snapshot.

- [ ] **CR-12 · Mostrar y editar patrimonio.** Depende de CR-02/11.
  - Aceptación: valoración y procedencia visibles; editar activo/pasivo actualiza el total; respaldo y perfiles preservados.
  - Verificación: recorrido equivalente web/móvil con los casos de CR-11 y revisión visual.
  - Archivos: `src/workspace/app.mjs`, `mobile/src/screens/forms.tsx`, `mobile/src/screens/main.tsx` y hasta dos rutas/componentes nuevos.

- [ ] **CR-26 · Presupuestar categorías y comparar períodos.** Depende de CR-01.
  - Aceptación: límites por categoría/período con los límites anteriores como valores heredados; desviación frente a gasto real y comparación del período anterior; sin período previo muestra ausencia de referencia.
  - Verificación: cambio de mes, presupuesto cero/ausente, moneda y datos previos sin alterar; comparación con base cero no inventa porcentajes.
  - Archivos: nuevos `src/workspace/budgets.mjs`, `tests/budgets.test.mjs`; contrato y pruebas de snapshot.

- [ ] **CR-27 · Editar presupuestos y comparar desde ambos canales.** Depende de CR-02/26.
  - Aceptación: elegir categoría y período, editar y guardar; resumen explica desvío y comparación; recarga/respaldo conserva límites por espacio y mes.
  - Verificación: mismo caso en web/móvil y revisión del período anterior, importación y alerta de gasto.
  - Archivos: `src/workspace/app.mjs`, `src/workspace/reports.mjs`, `mobile/src/screens/forms.tsx`, `mobile/src/screens/main.tsx` y un componente auxiliar como máximo.

**Comprobación Personal:** recurrentes y pagos no se duplican; capital/intereses conservan su significado, el patrimonio concilia y los presupuestos se comparan en una misma moneda y período.

- [ ] **CR-13 · Modelar pendientes de cobro y pago.** Depende de CR-01/09.
  - Aceptación: vencimiento/saldo/estado/contraparte; pagos parciales vinculables a movimiento existente; previsiones separadas de realizados.
  - Verificación: vencido, parcial, anulación, vínculo repetido y conciliación sin doble ingreso/gasto.
  - Archivos: nuevos `src/workspace/dues.mjs`, `tests/dues.test.mjs`; contrato y pruebas de snapshot.

- [ ] **CR-14 · Gestionar cuentas por cobrar y pagar.** Depende de CR-02/13.
  - Aceptación: agenda editable en Empresa y cliente del asesor; estado y vínculo de pagos visibles; ninguna entrada prevista se cobra automáticamente.
  - Verificación: crear pendiente, vincular pago parcial, editar fecha, recargar y restaurar en web/móvil.
  - Archivos: `src/workspace/app.mjs`, `mobile/src/screens/forms.tsx`, `mobile/src/screens/main.tsx` y hasta dos rutas/componentes nuevos.

- [ ] **CR-15 · Calcular caja programada de 13 semanas.** Depende de CR-07/09/13.
  - Aceptación: 13 intervalos con apertura/cobros/pagos/cierre; vencidos con supuesto explícito; escenarios no alteran la base.
  - Verificación: calendario, parciales, semana sin partidas, atraso entre semanas y conciliación exacta por moneda; stress test anterior sigue pasando.
  - Archivos: nuevos `src/services/financial/ScheduledCashFlowService.js`, su prueba; `src/services/financial/WorkspaceAnalysis.js` y su prueba.

- [ ] **CR-16 · Explorar caja semanal y escenarios.** Depende de CR-14/15.
  - Aceptación: gráfico y tabla coinciden; cada cifra abre sus partidas; vista personal usa recurrentes/deudas y vista empresarial pendientes de cobro/pago, con aproximación anterior identificada por separado.
  - Verificación: caso empresarial conocido en web/móvil, escenario de atraso y exportación de evidencia.
  - Archivos: `src/components/workspace/FinancialIntelligence.jsx`, `src/workspace/reports.mjs`, `mobile/src/screens/main.tsx` y hasta dos componentes auxiliares.

- [ ] **CR-17 · Reforzar evidencia y evaluación de previsiones.** Depende de CR-15.
  - Aceptación: conserva mínimos de historial; informa error/ventana/supuestos; ausencias y ratios no calculables no se convierten en cero.
  - Verificación: series conocidas con meses discontinuos, poco historial y denominador cero; regresión de servicios originales.
  - Archivos: `src/services/financial/ForecastingService.js`, su prueba, `src/services/financial/WorkspaceAnalysis.js`, su prueba.

**Comprobación Empresa:** conciliar cada semana y total; demostrar pagos parciales y que una previsión no duplica movimientos ni cambia resultados reales.

- [ ] **CR-18 · Consolidar clientes por moneda.** Depende de CR-06/11/15.
  - Aceptación: agrupación por código monetario; clientes archivados identificados; importes incompletos y fecha de actualización visibles.
  - Verificación: dos clientes CLP y uno USD, sin conversión implícita, ni acceso a otro espacio/cuenta.
  - Archivos: nuevos `src/workspace/portfolio.mjs`, `tests/portfolio.test.mjs`.

- [ ] **CR-19 · Ofrecer portafolio e informes por cliente.** Depende de CR-18.
  - Aceptación: navegar de consolidado a cliente; exportar período/moneda/evidencia; exportar no envía datos ni concede acceso remoto.
  - Verificación: aislamiento, selección, archivo y reporte sin publicidad en web/móvil.
  - Archivos: `src/workspace/app.mjs`, `src/workspace/reports.mjs`, `mobile/src/screens/main.tsx` y hasta dos rutas/componentes nuevos.

- [ ] **CR-20 · Generar alertas locales explicables.** Depende de CR-07/09/13/15/26.
  - Aceptación: condición y evidencia verificables; preferencia de frecuencia/descarte; no dispara comunicaciones ni operaciones externas.
  - Verificación: vencimientos, desviación de presupuesto, mínimos de caja y repetición de evaluación sin alertas duplicadas.
  - Archivos: nuevo `src/workspace/alerts.mjs`, `tests/alerts.test.mjs`; integración acotada con `src/services/notifications/NotificationService.js`.

- [ ] **CR-21 · Revisar alertas en la aplicación.** Depende de CR-20.
  - Aceptación: centro contextual por espacio/cliente; abrir evidencia y descartar; no se anuncian canales de correo/push inexistentes.
  - Verificación: cambio de perfil/cliente, recarga, teclado y preferencias en ambos canales.
  - Archivos: `src/workspace/app.mjs`, `mobile/src/screens/main.tsx`, `mobile/src/screens/forms.tsx` y hasta dos componentes nuevos.

**Comprobación Asesor:** portafolio por moneda, informe individual y alertas aisladas; ningún cliente local se presenta como cuenta compartida/autorizada en remoto.

- [ ] **CR-22 · Definir política publicitaria aislada.** Depende de CR-00.
  - Aceptación: ubicaciones/densidad permitidas; contrato solo editorial; apagado independiente y consentimiento controlan toda carga externa.
  - Verificación: pruebas de política y revisión de dependencias; entradas financieras/identidad rechazadas.
  - Archivos: nuevos `src/monetization/policy.mjs`, `tests/monetization.test.mjs`, documentación de configuración.

- [ ] **CR-23 · Reservar espacios secundarios accesibles.** Depende de CR-22 y flujos principales estables.
  - Aceptación: landing/recursos identificados y con tamaño reservado; sin proveedor por defecto; ausencia/fallo no bloquea lectura o uso financiero.
  - Verificación: teclado, responsive, movimiento reducido, red y comparación de rendimiento con módulo apagado/encendido.
  - Archivos: `index.html`, nuevo `src/monetization/slots.mjs`, `src/workspace/styles.css`, pruebas de política.

- [ ] **CR-24 · Verificar y publicar Crecimiento.** Depende de los recorridos incluidos y comprobados de CR-01–23 y CR-26/27; CR-25 no es obligatorio si la publicidad queda apagada.
  - Aceptación: suites/build/lint/TypeScript y revisión visual; APK nuevo con firma/código/hash correctos y descarga pública comprobada; prueba física e iPhone web registradas.
  - Verificación: comandos de la especificación, instalación y apertura en Android, CSV/respaldo/monedas, catálogo y redirecciones; documentar límites reales.
  - Archivos: versiones/lockfiles de los canales que se entreguen, catálogo y documentos de distribución; separar el commit de versión de cambios funcionales.

- [ ] **CR-25 · Activar un piloto publicitario configurado.** Condicional; depende de CR-22/23 y elección del titular de proveedor/condiciones.
  - Aceptación: patrocinio/proveedor real identificado; consentimiento y frecuencia controlados; sin SDK externo en el origen financiero ni promesa de ingresos garantizados.
  - Verificación: aislamiento de DOM/almacenamiento/cookies y solicitudes inspeccionadas; rechazo de consentimiento, proveedor caído y comparación de rendimiento antes/después.
  - Archivos: adaptador del proveedor elegido, configuración segura, pruebas de política y documentación comercial/técnica.

## Posterior a esta versión

- [ ] Sincronización opcional con resolución de conflictos, cifrado, respaldo y aislamiento verificados.
- [ ] Compartición de cuentas reales de clientes con autorizaciones explícitas, permisos revocables y controles de servidor.
- [ ] Conexiones bancarias, conversión FX con fuente/fecha, CRM completo o LLM externo, solo con necesidad y costes definidos.
- [ ] Distribución nativa de iOS después de disponer de la cuenta, firma y entorno de compilación correspondientes.
