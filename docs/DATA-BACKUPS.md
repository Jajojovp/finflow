# Contrato de respaldos · Crecimiento

CR-01 incorpora `src/workspace/snapshot.mjs`, compartido por web y Expo. El formato de intercambio es `finflow-backup-v2`, con `schemaVersion: 2`, origen, fecha, ámbito y estado completo. El estado móvil conserva su versión interna 1; no se cambian las claves de almacenamiento existentes por introducir este formato.

El lector acepta los respaldos anteriores `finflow-mobile-v1` y la estructura web anterior de localStorage. Marca ambos como legado y sin ámbito declarado. La integración de restauración debe mostrar esa condición en la vista previa antes de confirmar.

El ámbito es `local` o `google:IDENTIFICADOR` y se obtiene de la clave de almacenamiento ya existente. No contiene correo, nombre, token ni credencial. Compararlo evita mezclar por accidente cuentas o modo local; el marcador de un archivo editable no es una firma ni una autorización de acceso remoto.

Los campos JSON adicionales se conservan. Se validan perfil, cliente, moneda, identificadores, movimientos, metas, progreso, configuración mensual, presupuestos y entradas numéricas del análisis. Un error rechaza el conjunto. El límite es 4 MB de UTF-8, 5.000 movimientos activos y 5.000 archivados por espacio, y hasta 100 clientes locales del asesor, además de los dos perfiles propios.

La importación/restauración trabaja sobre una copia. Los identificadores existentes no se regeneran y los importes conservan hasta cuatro decimales. Normalizar un legado web aplica a sus ejemplos las mismas clasificaciones que utilizaba la interfaz anterior. Las 176 monedas usan el catálogo existente.

## CR-02 · Restauración completa

La web incorpora «Mis datos y respaldos», con descarga JSON, selección local del archivo, resumen de espacios/monedas/movimientos y confirmación de restauración completa. Antes de sustituir el estado se guarda una copia `:before-restore`, accesible desde el mismo diálogo para revisar y recuperar. Las filas, incluidos sus identificadores, se codifican al mostrarse en HTML.

La pantalla «Llevar mis datos» de Expo permite revisar un respaldo y elegir restauración completa o la opción anterior de añadir únicamente movimientos conservando ajustes. El provider identifica el ámbito desde su clave de almacenamiento, escribe antes de actualizar React y permite revisar la copia anterior. Los errores de validación, recuperación o escritura no confirman cambios ni sustituyen el estado visible.

Comprobaciones: 8 pruebas del contrato y 4 de fallos/recuperación; 13 pruebas del modelo móvil; TypeScript y build web. En navegador local se probaron rechazo por otra cuenta, preview/cancelación, restauración en CLP, recarga y recuperación del estado anterior ARS/CAD. Un identificador con comillas se conservó sin crear atributos HTML adicionales. La comprobación física de Android se registra por separado de estas pruebas.

## CR-03 · Guardado web transaccional

`storage.mjs` migra cada clave de cuenta/modo local a IndexedDB, base `finflow-workspaces`. Valida antes de migrar y conserva intacto el localStorage original. Restaurar escribe la copia anterior y el reemplazo en una sola transacción. La interfaz solo anuncia «Guardado» después de `transaction.oncomplete`; un aborto conserva el estado confirmado y los campos del formulario para poder reintentarlo. Véanse los eventos [complete](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction/complete_event) y [abort](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction/abort).

Cada escritura compara una revisión dentro de la transacción. Una pestaña desactualizada recibe un aviso y no reemplaza datos nuevos; debe recargar antes de continuar. Si no puede abrirse la base o validar la migración, se ofrece reintentar y descargar los datos originales, sin iniciar un espacio vacío ni borrar el origen.

Comprobaciones: 7 pruebas del adaptador con IndexedDB simulado, incluidas migración concurrente, ámbito de cuenta, escrituras en cola y aborto real de transacción con recuperación atómica. En navegador se editó el disponible de ARS 1.500 a 1.600; otra pestaña intentó guardar 1.700, fue rechazada y al recargar recuperó 1.600. Suite de 89 pruebas y build web correctos. La web pública todavía no se actualiza por registrar este incremento.

## CR-04/05 · CSV revisado antes de escribir

`inspectCSV` reutiliza el parser existente y devuelve todos los errores de fila. `reviewImport` prepara el lote sin modificar el destino: cuenta filas, duplicados y errores; conserva hasta cuatro decimales y comprueba 2 MB de UTF-8 y la capacidad de 5.000 movimientos. Un error bloquea el lote completo. `applyImport` revalida moneda/capacidad y duplicados al confirmar; evita también colisiones con identificadores archivados.

Web y Expo muestran destino, moneda, resumen y hasta cinco registros antes de confirmar. Los errores indican su fila; se muestran los primeros veinte y se avisa si hay más. Cancelar no escribe. Los gastos quedan sin clasificación financiera para su revisión posterior.

Comprobaciones: 5 pruebas nuevas del contrato y las 5 anteriores del parser; pruebas móviles de revisión sin cambios, confirmación repetida y cambio de moneda. En navegador web se rechazó un CSV con dos errores, se canceló un lote válido y después se confirmó: 2 registros nuevos y 1 duplicado. Reimportarlo mostró 0 nuevos y 3 duplicados. En Expo web se comprobó el mismo recorrido; además, copiar respaldo, restaurar completo en CLP y revisar la copia anterior en EUR. Son pruebas de interfaz web de Expo, no una instalación física Android/iOS.
