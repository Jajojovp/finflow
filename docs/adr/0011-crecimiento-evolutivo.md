# ADR 0011: Crecimiento sobre la plataforma gratuita existente

- **Estado:** Decisiones de producto aceptadas; diseño técnico e implementación pendientes por tarea.
- **Fecha:** 2026-10-30.
- **Responsable:** Jairo, con confirmación expresa del diseño claro.
- **Especificación:** [Crecimiento](../CRECIMIENTO.md).

## Contexto

FinFlow dispone de web integrada 2.4.0, Android 1.1.0, tres perfiles, servicios financieros del repositorio original, datos locales, acceso Google opcional y 176 monedas. El nuevo documento de producto solicita continuidad, expansión y gratuidad con publicidad selectiva.

La especificación V3 histórica plantea reescrituras, backend obligatorio y otra infraestructura. Su auditoría de interfaz y datos no describe por completo la versión integrada. Aplicarla literalmente descartaría trabajo ya entregado y contradiría la decisión actual del usuario.

El repositorio contiene un ADR de despliegue 0001 y decisiones internas 0001–0010 en la especificación V3. Se utiliza 0011 para no reutilizar los números 0008–0010 propuestos en el nuevo texto para otros asuntos.

## Decisión

1. Conservar el diseño claro, tipografía, navegación, GSAP web, experiencias Expo y todos los módulos existentes. Las mejoras funcionales se incorporan de forma aditiva.
2. Mantener una plataforma gratuita y abierta, con Personal, Empresa y Asesor, núcleo matemático compartido y presentación por perfil. No adoptar suscripciones ni paywalls para funciones principales.
3. Mantener el estado local y el Google opcional existentes. Evolucionar la web de localStorage a IndexedDB mediante copia, verificación y recuperación; conservar SQLite móvil y compatibilidad de respaldos. El contrato de migración se completa antes de cambiar almacenamiento.
4. Tratar los clientes locales del asesor como registros aislados. Consolidar por moneda. La colaboración con cuentas reales requiere autorización y controles de servidor en una etapa posterior.
5. Separar la publicidad del dominio financiero. Empezar por contenido contextual y patrocinios con límites de ubicación, datos y rendimiento. La activación de un proveedor es un trabajo separado y condicionado a su selección y configuración.
6. Añadir caja semanal basada en vencimientos junto al stress test existente; conservar trazabilidad, ausencia de datos y supuestos. Las previsiones no se convierten automáticamente en cobros reales ni contabilidad de devengo.
7. Mantener Hostinger para el dominio canónico/backend OAuth y Sites para su frontend existente. No ejecutar una migración a Vercel, Fastify/PostgreSQL, multi-tenancy, servicios de pago o nuevo proveedor de identidad por seguir documentación antigua.

## Alternativas consideradas

- **Ejecutar la V3 literalmente:** descartado por incompatibilidad con continuidad, gratuidad y estado publicado.
- **Crear tres aplicaciones:** descartado por duplicación de fórmulas y mantenimiento.
- **Mantener indefinidamente todo en localStorage:** se conserva como origen recuperable durante la transición, pero no se elige como almacenamiento de crecimiento por las necesidades de transacciones y migración.
- **Introducir nube y publicidad de red al principio:** pospuesto hasta definir aislamiento, consentimiento, costes y verificación del flujo financiero.

## Consecuencias

La especificación de Crecimiento prevalece sobre las instrucciones incompatibles de V3 y el supuesto histórico de Vercel. Los documentos anteriores se mantienen como evidencia histórica.

El primer valor entregable es proteger los datos e introducir revisión/confirmación; después se añaden capacidades financieras por recorridos completos en web y móvil. El plan no implica que las capacidades nuevas estén publicadas, que la publicidad genere ingresos o que exista sincronización.

Las decisiones nuevas sobre proveedores, esquema de colaboración o contabilidad completa deberán documentarse aparte. El plan y la matriz de trazabilidad distinguen base existente, ampliación prevista y trabajo posterior.
