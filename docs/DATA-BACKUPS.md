# Contrato de respaldos · Crecimiento

CR-01 incorpora `src/workspace/snapshot.mjs`, compartido por web y Expo. El formato de intercambio es `finflow-backup-v2`, con `schemaVersion: 2`, origen, fecha, ámbito y estado completo. El estado móvil conserva su versión interna 1; no se cambian las claves de almacenamiento existentes por introducir este formato.

El lector acepta los respaldos anteriores `finflow-mobile-v1` y la estructura web anterior de localStorage. Marca ambos como legado y sin ámbito declarado. La integración de restauración debe mostrar esa condición en la vista previa antes de confirmar.

El ámbito es `local` o `google:IDENTIFICADOR` y se obtiene de la clave de almacenamiento ya existente. No contiene correo, nombre, token ni credencial. Compararlo evita mezclar por accidente cuentas o modo local; el marcador de un archivo editable no es una firma ni una autorización de acceso remoto.

Los campos JSON adicionales se conservan. Se validan perfil, cliente, moneda, identificadores, movimientos, metas, progreso, configuración mensual, presupuestos y entradas numéricas del análisis. Un error rechaza el conjunto. El límite es 4 MB de UTF-8, 5.000 movimientos activos y 5.000 archivados por espacio, y hasta 100 clientes locales del asesor, además de los dos perfiles propios.

La importación/restauración trabaja sobre una copia. Los identificadores existentes no se regeneran y los importes conservan hasta cuatro decimales. Normalizar un legado web aplica a sus ejemplos las mismas clasificaciones que utilizaba la interfaz anterior. Las 176 monedas usan el catálogo existente.

Comprobaciones iniciales: `node --test tests/snapshot.test.mjs`, suite Vitest y TypeScript móvil. La integración de vista previa, confirmación y recuperación anterior corresponde a CR-02; este documento no afirma que el contrato por sí solo complete la interfaz de restauración.
