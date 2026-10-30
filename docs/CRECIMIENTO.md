# FinFlow · Crecimiento

Estado: especificación de la próxima versión; funcionalidades nuevas pendientes de implementación.
Fecha: 30 de octubre de 2026. Responsable de producto: Jairo.
Base: web 2.4.0 y Android 1.1.0, revisión `e9fc95b2e79e58b962e3484ff23b20f6c3d1502c`.

## Objetivo y decisiones confirmadas

Ampliar FinFlow para comprender, administrar y anticipar las finanzas de personas, empresas y clientes de un asesor. El documento «FinFlow — Rediseño evolutivo y expansión del producto» aportado por el usuario es el origen del alcance. La confirmación posterior del usuario mantiene el diseño claro actual.

- Conservar la arquitectura publicada, las funcionalidades y los servicios financieros originales de `Jajojovp/finflow`.
- Mantener colores, tipografía y estructura claros, de inspiración Mac/Apple. GSAP sigue en la web, respetando movimiento reducido; la app conserva controles y transiciones nativos de Expo.
- Ofrecer una plataforma gratuita y de código abierto, con Personal, Empresa y Asesor/profesional. Los mismos motores sirven a experiencias adaptadas a cada perfil.
- Mantener las 176 monedas, su precisión y su elección por espacio/cliente. Cambiar moneda conserva importes; no equivale a convertir divisas.
- Desarrollar publicidad contextual identificada, separada de los datos y decisiones financieros, después de estabilizar los flujos principales.
- Mantener el uso local sin registro y el acceso opcional de Google ya existente. La colaboración y la sincronización pertenecen a una etapa posterior.

El diseño oscuro Dark Luxe citado en el documento de origen corresponde a una etapa histórica del repositorio. Para esta versión rige la confirmación del diseño claro. La opción de apariencia ya existente se conserva.

## Base comprobada frente al documento de origen

La revisión de código distingue lo existente de lo pendiente; no es una nueva certificación de ejecución en dispositivos.

| Área | Estado en la base publicada | Trabajo de Crecimiento |
| --- | --- | --- |
| Entrada web | `index.html` carga `src/integrated-main.jsx`; `src/workspace` conserva la navegación por hash | Extender esa experiencia; las páginas React históricas permanecen como referencia |
| Datos web | Estado por espacio/cuenta en `src/workspace/app.mjs`, guardado en localStorage | Contrato versionado, respaldo completo y migración transaccional a IndexedDB |
| Datos móviles | Provider y modelo propios; `expo-sqlite/kv-store` en dispositivo y adaptador web | Extenderlos mediante adaptadores; conservar respaldos móviles v1 |
| Movimientos | Alta, edición, archivo/restauración y clasificación financiera | Conservar; vincular los módulos nuevos sin duplicar movimientos |
| CSV | Parser compartido con comillas, caracteres internacionales, límites y validación; web importa al elegir archivo | Añadir revisión, resumen de errores/duplicados y confirmación antes de escribir |
| Tres perfiles | Ya operativos; no hay que volver a crearlos | Completar capacidades específicas y la paridad entre web y móvil |
| Clientes | Web muestra tres entidades; móvil permite crear hasta 100 clientes locales | Gestión dinámica en web y portafolio por moneda en ambos canales |
| Resultados | Estado de resultados, equilibrio, escenarios y servicios originales integrados por `WorkspaceAnalysis` | Profundizar cobertura y explicaciones, conservando las fórmulas verificadas |
| Proyecciones | Forecasting y backtest existentes con condiciones de historial | Mantener límites y añadir evaluación y evidencia donde falten |
| Caja de 13 semanas | `CashFlowService.stressTest()` aproxima cobros desde ingresos mensuales mediante una curva exponencial | Añadir un modelo distinto basado en vencimientos y cobros/pagos pendientes |
| Monedas | Catálogo compartido de 176 códigos; CLP, ARS, USD y CAD disponibles | Proteger formato, cálculos, importación, respaldo y separación entre monedas |
| Identidad | Google opcional con backend PHP en Hostinger; datos financieros locales | Conservar identidad y aislamiento. No confundir un cliente local con una cuenta autorizada |
| Distribución | Web y APK ARM64 firmado; iPhone dispone de web instalable | Publicar nuevos artefactos solo después de verificarlos; la app iOS nativa requiere cuenta y firma |
| Presupuestos | Límite mensual y límites por categoría en web; controles móviles parciales | Presupuestos por categoría/período y comparación con el período anterior en ambos canales |
| Publicidad | Sin módulo publicitario integrado | Política aislada, espacios permitidos y piloto condicionado a selección de proveedor |

La matriz detallada está en [crecimiento-traceability.csv](crecimiento-traceability.csv). Las comprobaciones de la entrega anterior están en [MOBILE-VERIFICATION.md](MOBILE-VERIFICATION.md); no se presentan como pruebas recién ejecutadas para Crecimiento.

## Alcance funcional

### Datos y continuidad

- Un contrato compartido define espacio, perfil, cliente local, moneda, movimientos, configuración, metas, presupuestos y módulos adicionales. La interfaz y el almacenamiento actuales se conectan mediante adaptadores.
- El respaldo completo incluye estos datos, su versión y la procedencia del formato. CSV sigue sirviendo para movimientos; no se presenta como respaldo completo.
- Restaurar exige vista previa, validación y confirmación. El archivo inválido, la cancelación o un fallo de escritura no modifican el estado anterior.
- La migración web lee la clave existente de cada identidad, copia y verifica datos antes de marcar el nuevo almacenamiento como activo. Es repetible, conserva la fuente anterior y no mezcla identidades ni modo local.
- IndexedDB es la evolución del almacenamiento web; SQLite permanece en Android/iOS. Persistir datos no implica que la web ya pueda arrancar sin internet.
- Importar muestra las filas propuestas, errores y duplicados. Se conserva el comportamiento seguro de rechazar el lote inválido; no se omiten errores silenciosamente.

### Personal

- Presupuestos por categoría y período, comparación con gasto real y explicación de desviaciones.
- Plantillas recurrentes con calendario y confirmación de ocurrencias. Una plantilla no genera gastos realizados por sí sola; confirmar dos veces no duplica el movimiento.
- Deudas con capital pendiente, pagos, intereses y vencimientos. Capital, interés y comisión mantienen clasificaciones separadas; no se inventan tasas ni condiciones contractuales ausentes.
- Patrimonio con activos declarados, fecha de valoración y pasivos. El efectivo existente se incluye una sola vez.
- Metas, ahorro, educación y simuladores existentes permanecen disponibles. Las proyecciones muestran supuestos y escenarios.

### Empresa

- Agenda de cuentas por cobrar y pagar con importe, contraparte, vencimiento, estado, saldo pendiente y vínculos con pagos reales.
- Pagos parciales, anulaciones y vencimientos modifican el pendiente sin duplicar ingresos/gastos. La agenda proyectada no se suma a los movimientos realizados.
- Flujo de caja programado de 13 intervalos de siete días desde una fecha elegida: apertura + cobros previstos − pagos previstos = cierre; el cierre pasa a la siguiente semana.
- Las partidas vencidas se identifican aparte y requieren fecha prevista o supuesto explícito. No se consideran cobradas por haber vencido.
- Escenarios de atraso, costes e ingresos conservan la previsión base. Cada cifra muestra partidas y supuestos que la originan.
- El modelo semanal nuevo coexiste con el stress test mensual anterior, identificado como aproximación. No se anuncia contabilidad de devengo o libro mayor completo por añadir una agenda de vencimientos.
- Se conservan resultados, equilibrio, KPI, covenants, variaciones, anomalías y propuestas. Valores faltantes no se convierten en ceros; divisiones inválidas muestran «no calculable».
- Forecasting conserva los mínimos de historial existentes y no rellena meses ausentes. El backtest informa ventana, error y limitaciones cuando hay historial suficiente.

### Asesor/profesional

- Crear, nombrar y archivar/restaurar clientes locales en ambos canales, conservando sus registros e identificadores anteriores.
- Vista individual y portafolio por moneda, con fecha de actualización e integridad de la información. No sumar CLP con USD ni asumir tasas de cambio.
- Informes por cliente/período con moneda, fuentes, cálculos y limitaciones; exportar no equivale a enviar ni compartir automáticamente.
- Alertas dentro de la aplicación basadas en datos locales y criterios revisables, con preferencias de frecuencia y descarte. Correo y push remotos necesitan una etapa específica.
- El acceso a la cuenta real de un cliente se pospone hasta contar con autorización explícita, permisos revocables, verificación en servidor y aislamiento. Una pantalla de permisos o Google por sí solos no cumplen ese requisito.

### Publicidad y sostenibilidad

- Ubicaciones iniciales: pie de landing y recursos educativos. Máximo inicial: un espacio visible por página, con dimensiones reservadas y etiqueta «Publicidad» o «Patrocinado».
- Sin anuncios sobre KPI, gráficos, movimientos, importación, previsiones, recomendaciones, exportaciones o formularios críticos. Sin anuncios de pantalla completa ni anuncios necesarios para desbloquear funciones.
- El módulo recibe únicamente ubicación y contexto editorial general; no recibe movimientos, importes, deudas, patrimonio, identidades ni identificadores de clientes.
- Preferir patrocinios con recursos propios y sin scripts externos. Un proveedor externo no puede ejecutar su SDK en el contexto que contiene los datos financieros: debe aislarse mediante un frame de origen separado, [sandbox y políticas restrictivas](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe#sandbox), sin acceso al DOM, almacenamiento ni cookies de FinFlow. Verificar ese aislamiento antes del piloto; limitar el payload no basta si el script puede leer la página.
- Carga diferida y aislada. Rechazar consentimiento o fallar el proveedor no bloquea la aplicación; no se carga el proveedor cuando no está permitido.
- Comenzar con patrocinios/contexto editorial. Proveedor, condiciones y configuración comercial quedan por seleccionar antes del piloto; no se dan de alta servicios ni compromisos económicos con este plan.
- Medir visibilidad, ingresos, coste, quejas y efecto sobre rendimiento/retención. No se prometen ingresos suficientes para financiar la operación.

## Arquitectura y estilo de implementación

| Responsabilidad | Ubicación actual y extensión prevista |
| --- | --- |
| Presentación web | `src/workspace/`, `src/integrated-main.jsx`, `index.html` |
| Dominio financiero original | `src/services/financial/`, `src/services/core/`, `src/services/agent/` |
| Lógica compartida adicional | Módulos `.mjs` junto al núcleo en `src/workspace/`; independientes del DOM, React y Expo |
| Interfaz móvil | `mobile/src/screens/`, `mobile/src/components/`, `mobile/src/app/` |
| Estado y persistencia móvil | `mobile/src/data/`; adaptadores sobre el contrato compartido |
| Almacenamiento web propuesto | Adaptador en `src/workspace/storage.mjs` y migraciones explícitas |
| Publicidad propuesta | `src/monetization/`; sin importaciones del estado financiero |
| Pruebas y decisiones | `tests/`, pruebas colocadas junto a servicios/modelo, `docs/adr/` |

Conservar la organización y el estilo del módulo modificado. Ejemplo existente en `src/workspace/currencies.mjs`:

```js
export function changeCurrency(workspace, code) {
  if (!isCurrencyCode(code)) throw new Error('Selecciona una moneda válida del catálogo.');
  return { ...workspace, currency: code };
}
```

El helper valida el código y devuelve un espacio actualizado sin depender de la pantalla ni alterar movimientos. Mantener JavaScript del núcleo y TypeScript móvil; no exigir una migración general de lenguaje, un nuevo framework o una infraestructura distribuida.

## Verificación y condiciones de entrega

Comandos desde la raíz, con las dependencias existentes:

```powershell
npm test
node --test tests/core.test.mjs tests/finance.test.mjs tests/currencies.test.mjs tests/downloads.test.mjs tests/auth.test.mjs
python tests/auth_server_test.py
npm run build
npm run lint
npm --prefix mobile run typecheck
```

Los controles de Expo se ejecutan en `mobile/` con Node 24: `node node_modules/expo/bin/cli install --check`. La compilación final de Android se realiza en la copia de ruta corta documentada en [DISTRIBUTION.md](DISTRIBUTION.md), sin regenerar ni exponer la firma existente.

- Todas las pruebas existentes y nuevas pasan; lint sin errores y sin advertencias nuevas injustificadas. Las pruebas nuevas cubren reglas financieras, fallos de escritura y migración, no solo renderizados.
- Crear/editar/importar/restaurar un movimiento produce cifras coherentes en resumen, resultados, metas y alertas del mismo espacio.
- Se comprueban aislamiento entre perfiles, cuentas y clientes; restauración v1; moneda y decimales; idempotencia de importaciones, recurrencias y pagos parciales.
- Revisión visual a 375, 768, 1024 y 1440 px, teclado, foco, lector de pantalla, contraste y movimiento reducido. Objetivo: [WCAG 2.2 AA](https://www.w3.org/TR/WCAG22/), sin declarar conformidad antes de auditarla.
- Objetivos de campo: LCP ≤ 2,5 s, INP ≤ 200 ms y CLS ≤ 0,1 al percentil 75, siguiendo [Web Vitals](https://web.dev/articles/vitals). Registrar condiciones de laboratorio por separado; no afirmar cumplimiento de campo sin datos.
- Android: verificar APK nuevo, versión/código crecientes, firma, contenido, alineamiento y hash de la descarga pública. Incluir prueba en dispositivo físico; la entrega 1.1.0 aún no cuenta con esa comprobación.
- iPhone: verificar la web instalable; una entrega nativa exige cuenta/firma Apple y verificación separada. No anunciar un instalador iOS inexistente.
- Publicidad: verificar ausencia de datos financieros en solicitudes, rechazo de consentimiento, proveedor caído y presupuesto de rendimiento antes de activarla.

## Límites y decisiones pendientes

Siempre: preservar servicios y rutas, datos y demo; migraciones recuperables, evidencia de fórmulas, precisión monetaria y cambios pequeños.

Resolver con el titular cuando se materialice: proveedor/condiciones de publicidad; nuevos costes o cuentas; activación de servicios externos; diseño de permisos y conflictos antes de colaboración real; distribución Apple. No bloquean la preparación de este plan ni el desarrollo local de los módulos financieros.

Nunca: secretos en cliente/repositorio/APK; suscripciones o paywalls para funciones principales; anuncios dirigidos con datos financieros; pagos o inversión autónomos; acceso automático a cuentas de clientes; reescritura general o eliminación de capacidades como atajo.

Sincronización, conexiones bancarias, FX automático, CRM completo, ledger de doble entrada, LLM externo y microservicios son ampliaciones posteriores sujetas a necesidades y contratos concretos.

El nombre de la versión es **Crecimiento**. Los números de versión, paquete y código de Android se asignarán al preparar los artefactos comprobados; este documento no altera la versión actualmente distribuida.

## Documentos de ejecución

- [Plan y orden de trabajo](../tasks/plan.md).
- [Tareas con aceptación y comprobación](../tasks/todo.md).
- [ADR 0011: continuidad del producto](adr/0011-crecimiento-evolutivo.md).
- [Guía de transacciones y actualización de IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB).
