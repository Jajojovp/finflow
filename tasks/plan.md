# Plan de implementación · FinFlow Crecimiento

Estado al 31 de octubre de 2026: hito 1 implementado y comprobado en web local y Expo web. Web 2.5.0 y APK 1.2.0 publicados en finflow.sysora.io mediante Hostinger Connector; descarga completa, hash y redirecciones comprobados. Sites conserva su publicación privada anterior de esta fase; habilitar allí la descarga queda pendiente porque la conexión actual no puede acceder al proyecto. Los hitos funcionales 2–5 ya están implementados en local; la candidata conjunta 2.6.0 / Android 1.3.0 está en comprobación de entrega, sin subidas intermedias. Véase [implementación y límites](../docs/GROWTH-IMPLEMENTATION.md).
Fuente: [especificación](../docs/CRECIMIENTO.md), [ADR 0011](../docs/adr/0011-crecimiento-evolutivo.md), [tareas](todo.md).

**Instrucción del titular, 31 de octubre de 2026:** continuar todos los hitos pendientes en local. No subir commits, publicar en Hostinger/Sites ni sustituir el APK público hasta terminar y verificar todos los cambios de las fases incluidas. Los commits locales conservan avances. CR-25 sigue condicionado a proveedor y condiciones comerciales; por defecto la publicidad permanece apagada. Las pruebas en dispositivos y cuentas externas se registran por separado, sin declararlas realizadas.

## Estrategia

Cada tarea entrega un comportamiento comprobable sobre la base existente. Se separan reglas compartidas, integración de pantallas y distribución; una función se considera completa cuando su recorrido está conectado y verificado en los canales incluidos.

No se cambia el diseño claro ni se recrean los tres perfiles. El `DataContext` React histórico no sustituye al estado publicado ni al provider móvil: se reutilizan ambos a través de contratos y adaptadores. Los servicios originales permanecen en sus carpetas.

## Dependencias

```text
CR-00 inventario → CR-01 contrato y compatibilidad
                  ├─ CR-02 respaldo → CR-03 IndexedDB
                  ├─ CR-04 revisión CSV → CR-05 interfaces de importación
                  ├─ CR-06 clientes web
                  ├─ CR-07 recurrencias → CR-08 interfaces
                  ├─ CR-09 deudas → CR-10 interfaces
                  ├─ CR-11 patrimonio → CR-12 interfaces
                  ├─ CR-26 presupuestos/comparación → CR-27 interfaces
                  └─ CR-13 vencimientos → CR-14 interfaces
CR-07 + CR-09 + CR-13 → CR-15 caja semanal
CR-14 + CR-15 → CR-16 interfaces; CR-15 → CR-17 evaluación de previsiones
CR-06 + datos ampliados → CR-18 consolidación → CR-19 portafolio e informes
CR-07/09/13/15/26 → CR-20 alertas → CR-21 interfaces
Flujos estables → CR-22 política publicitaria → CR-23 espacios → CR-25 piloto externo
Recorridos completos, incluidos CR-26/27 → CR-24 comprobación y publicación
```

CR-25 es condicional: sin proveedor configurado la publicidad permanece desactivada y no se anuncian ingresos. CR-24 puede distribuir la ampliación financiera sin ese piloto.

## Hitos y puntos de comprobación

| Hito | Tareas | Resultado observable | Comprobación para avanzar |
| --- | --- | --- | --- |
| 0 · Continuidad | CR-00 | Inventario actual, brechas y documentos alineados | Cada propuesta distingue lo existente de lo nuevo; diseño claro confirmado |
| 1 · Datos protegidos | CR-01–06 | Respaldo completo, restauración, revisión CSV, almacenamiento web seguro y clientes dinámicos | Cancelación/error no pierde datos; recarga y separación por identidad/cliente; respaldos v1 recuperables |
| 2 · Finanzas personales | CR-07–12, CR-26/27 | Recurrentes, deudas, patrimonio, presupuestos y comparaciones conectados a movimientos y metas | Sin duplicados; capital/intereses separados; efectivo contado una vez; paridad web/móvil |
| 3 · Liquidez empresarial | CR-13–17 | Pendientes, pagos parciales, 13 semanas y previsiones explicables | Caja concilia por semana, vencidos visibles, escenarios reversibles y ausencia de doble contabilización |
| 4 · Trabajo profesional | CR-18–21 | Portafolio por moneda, informes y alertas dentro de la app | Un cliente no accede a otro; exportación conserva evidencia; CLP y USD permanecen separados |
| 5 · Sostenibilidad | CR-22–23, CR-25 condicional | Política, espacios limitados y piloto contextual cuando esté preparado | Sin datos financieros en solicitudes ni anuncios en flujos críticos; rechazo y fallo del proveedor no bloquean |
| 6 · Entrega | CR-24 | Web y APK nuevos verificados; iPhone web comprobado | Pruebas, navegación, diseño, firma, descarga pública y prueba en dispositivo físico registradas |

Antes de cerrar cada hito: registrar pruebas y límites, revisión de cambios y recorrido real con datos sintéticos. Los criterios que dependen de cuentas/proveedores/dispositivos se identifican como pendientes, sin convertirlos en resultados aprobados.

## Orden de ejecución y trabajo paralelo

1. Completar CR-01/02 antes de cambiar persistencia o añadir datos que no entren en el respaldo.
2. Implementar IndexedDB y revisión CSV por separado; coordinar su integración porque ambas modifican el guardado web.
3. Tras estabilizar el contrato, las reglas de recurrencias, deuda y patrimonio pueden desarrollarse por separado. Las modificaciones de `app.mjs`, pantallas móviles y rutas se integran secuencialmente para evitar conflictos.
4. Completar vencimientos antes de caja semanal. Resolver identidad/vínculos de pagos antes de presentar las cifras.
5. Desarrollar el portafolio después de la gestión de clientes y las reglas de consolidación por moneda.
6. Preparar publicidad con datos editoriales independientes; conectar sus espacios después de comprobar los recorridos principales.
7. Compilar el APK firmado al estabilizar una entrega; durante cada tarea usar pruebas focalizadas y TypeScript. Mantener la copia corta de compilación y la clave privada existentes.

No se comprometen fechas ni costes sin conocer capacidad de trabajo y proveedor. P0/P1/P2/P3 indican dependencia y prioridad, no niveles comerciales ni funciones de pago.

## Verificación por tipo de cambio

| Cambio | Comprobación mínima |
| --- | --- |
| Regla matemática | Casos conocidos, extremos, faltantes, denominador cero, moneda y precisión; prueba compartida web/móvil |
| Persistencia | Leer v1, migración repetida, fallo de cuota/escritura, cierre/otra pestaña, recuperación e identidad distinta |
| Importación | Preview sin escritura; cancelar; lote inválido; comillas/Unicode; duplicados; confirmación única |
| Pantalla | Recorrido conectado con datos sintéticos, teclado/foco, movimiento reducido y tamaños definidos |
| Publicidad | Red inspeccionada, datos permitidos, ausencia de tráfico sin consentimiento, proveedor caído y rendimiento |
| Publicación | Versión/firma/hash nuevos, catálogo coherente, descarga completa y redirecciones antiguas |

Ejecutar las órdenes completas de [CRECIMIENTO.md](../docs/CRECIMIENTO.md#verificación-y-condiciones-de-entrega). No reinstalar dependencias ni reconstruir Android por cambios exclusivos de documentación.

## Riesgos y tratamiento

| Riesgo | Tratamiento |
| --- | --- |
| Aplicar una auditoría histórica al producto actual | Matriz con archivos actuales; prioridad de Crecimiento sobre las reescrituras V3 |
| Perder datos al migrar | Respaldo previo, validación y commit transaccional; origen anterior conservado |
| Duplicar gastos/pagos recurrentes | Identificador estable de ocurrencia/pago y pruebas de idempotencia |
| Confundir caja, deuda y resultado | Clasificaciones separadas, previsiones fuera de movimientos realizados y conciliación visible |
| Sumar monedas distintas | Consolidación por código; conversión externa aplazada |
| Simular permisos reales del asesor | Clientes locales claramente identificados; compartir cuentas exige servidor y autorización posterior |
| Anuncios afectan confianza o rendimiento | Patrocinios sin SDK o frame aislado del origen financiero, zonas limitadas y desactivación independiente |
| Entregar otra vez un APK anterior | Recibo con procedencia, versión/código, hash, firma y verificación del archivo servido |
| Prometer capacidades móviles no comprobadas | Registrar prueba física y distinguir web instalable de app iOS nativa |

## Resultado de esta preparación

El hito 0 deja disponibles la especificación, decisiones, matriz y tareas. El hito 1 incorpora respaldos completos compatibles, restauración recuperable, guardado web transaccional, revisión CSV y clientes dinámicos. Véanse las comprobaciones y límites en [DATA-BACKUPS.md](../docs/DATA-BACKUPS.md). Los hitos funcionales 2–5 están implementados en local y el hito 6 permanece en verificación. El piloto comercial es condicional y sigue apagado; la revisión visual se aplazó a petición del titular. No se declara completada la distribución ni una prueba física a partir de la implementación.
