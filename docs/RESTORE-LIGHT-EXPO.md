# Restauración visual y app Expo

Referencia confirmada por Jairo: primera versión clara de `finflow.sysora.io`, no el prototipo oscuro servido en localhost:4173. Referencia de fuente: commit `1932666ad1f6dbf6d0de887e96c7cb0569fd548b` del Site.

## Web

- Conservar la paleta clara aprobada: fondo #f7f9fb, superficies blancas, azul #3478ee, acentos menta y melocotón, tipografía DM Sans con alternativas del sistema Apple.
- Servir la fuente localmente para que no cambie por fallos de Google Fonts.
- Recuperar la jerarquía visual anterior de Resultados: resumen, estado de resultados, equilibrio y escenario. El motor avanzado sigue disponible en un bloque desplegable al final.
- Mantener GSAP y el respeto de movimiento reducido, formularios, datos locales y motores originales.

## App

- Crear un proyecto Expo/TypeScript en `mobile/`, para iOS y Android, dentro del repositorio original.
- Utilizar las guías oficiales de `expo/skills`, revisión `8a0dc4fa57ae345923c357e1451cbcd8b6f2a7db`: estructura, navegación, UI, diseño y animaciones.
- Reutilizar los servicios originales de `src/services` y las fórmulas de gestión de `src/workspace`; no duplicar el motor financiero.
- Tres perfiles y datos separados por entidad; ingresos/gastos editables, resumen, resultados, fugas y objetivos, con almacenamiento local persistente.
- Controles y navegación nativos; transiciones de plataforma y movimiento reducido. GSAP se conserva en la web; la app usa las herramientas de animación de Expo adecuadas a vistas nativas.
- Validar tipos, exportaciones de iOS/Android y una vista web funcional. La comprobación en dispositivo físico se reportará por separado; no se solicitarán builds de pago ni publicación en tiendas.

## Entregas

1. Restaurar y verificar la web, después publicarla en el dominio y el Site existentes.
2. Completar y verificar la app Expo, con instrucciones reproducibles para Expo Go y límites de validación explícitos.
