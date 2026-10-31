# Patrocinios opcionales

El módulo está apagado: `src/monetization/config.mjs` declara `enabled: false`, sin proveedor ni orígenes autorizados. No se añaden SDK, cuentas, anuncios activos ni solicitudes de publicidad. CR-25 es un piloto condicional; requiere elegir proveedor y condiciones, además de comprobar aislamiento y rendimiento en navegador antes de activarlo.

Solo hay dos ubicaciones permitidas: pie de landing y recursos de aprendizaje. Se muestra como máximo una, con espacio reservado y etiqueta «Patrocinado». Ningún KPI, formulario, movimiento, recomendación, importación, exportación o proyección incluye publicidad. La app nativa no incorpora SDK publicitario.

El contrato recibe exactamente `placement` y `topic`, ambos de listas editoriales cerradas. Rechaza campos adicionales, destinos sin HTTPS, orígenes no autorizados, credenciales, parámetros y fragmentos. El proveedor no recibe moneda, importes, deudas, patrimonio, identidad, identificadores de cliente ni datos del almacenamiento financiero.

Se prefieren recursos estáticos, construidos con texto y enlaces sin scripts. Un proveedor externo solo puede utilizar un iframe de otro origen con `sandbox="allow-scripts"`, sin `allow-same-origin`, formularios, ventanas emergentes ni navegación superior. Referrer-Policy es `no-referrer`; se deniegan cámara, micrófono, ubicación, pagos y portapapeles. No hay mensajes entre el frame y FinFlow ni proxies de datos financieros.

Con un proveedor configurado se pide consentimiento antes de crear enlaces remotos o frames. La elección se guarda en una clave propia de consentimiento; el módulo no importa el estado financiero ni lee sus claves. Rechazar u ocultar elimina el frame. La función financiera sigue disponible si falla o está desactivado el patrocinio. No se declara cumplimiento legal ni rendimiento de campo a partir de estas pruebas de contrato.

Antes de un piloto: seleccionar un patrocinador real y recursos públicos; revisar condiciones/costes con el titular; verificar tráfico con aceptación/rechazo, fallo del proveedor y transiciones; comprobar que el frame no accede a DOM/almacenamiento/cookies de FinFlow; comparar carga y estabilidad con el módulo apagado; definir medición agregada de visibilidad, ingresos reales, costes y quejas. No se prometen ingresos.
