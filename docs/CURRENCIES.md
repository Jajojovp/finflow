# Monedas de FinFlow

El selector utiliza 176 códigos monetarios activos del catálogo ISO 4217 publicado por SIX el 17 de septiembre de 2026. Se excluyen XXX (sin moneda) y XTS (pruebas). Los nombres se localizan al español con Intl.DisplayNames al generar el catálogo; Android usa los nombres guardados, sin depender de esa API en el teléfono.

Fuente: https://www.six-group.com/dam/download/financial-information/data-center/iso-currrency/lists/list-one.xml

La portada incluye su propio selector para los importes ilustrativos, sin cambiar los registros de un espacio.

CLP, ARS, USD, CAD y EUR aparecen primero. Hay búsqueda por código y nombre. La elección se guarda por espacio o cliente, afecta movimientos, disponible, metas, resultados, análisis e informes, y se conserva en los respaldos móviles. El código evita confundir dólares o pesos que comparten símbolo.

Cambiar moneda conserva las cifras guardadas y no convierte saldos mediante tasas de cambio. El usuario debe elegir la unidad correcta de sus registros. No se mezclan monedas por movimiento ni se agrega el dinero de clientes de distintas monedas.

El formato aplica los decimales de ISO: CLP/JPY cero, USD/CAD/ARS dos, KWD tres y CLF cuatro. Las operaciones compartidas conservan al menos la precisión previa de dos decimales y amplían a tres o cuatro según la unidad. Los movimientos y CSV admiten hasta cuatro decimales; cambiar a una unidad sin decimales no reescribe registros antiguos fraccionarios.

Validación: catálogo completo, búsqueda sin tildes, formato y precisión, importación/exportación CSV, persistencia de las 176 monedas y separación entre clientes del asesor.
