# Verificación de la integración

Base original: `4ee8ed6c0ce50b688624cadb7200cd2b17599e8a`, repositorio `https://github.com/Jajojovp/finflow`.

## Cambios numéricos

- Se corrigió la inversión del signo de consumo en runway. Caja 300 y consumo mensual 50 producen seis meses; generación neta no produce una duración finita de agotamiento.
- Se incluyen otros ingresos sin alterar las ventas operativas; se separan capital y depreciación para reconciliar caja y resultado.
- Un COGS ausente en parte de la serie no se convierte en cero.
- Las proyecciones usan observaciones consecutivas y excluyen registros posteriores al periodo elegido. No se crean observaciones cero para meses vacíos.
- El balance desconocido propaga N/D. Los umbrales del mes se comparan con indicadores del mes, sin mezclarlos con márgenes acumulados.

## Comandos

`npm test` ejecuta los tests originales y la integración. `node --test tests/core.test.mjs tests/finance.test.mjs` verifica los formularios financieros auxiliares y CSV. `npm run build` compila Vite/React.

Con `dist` servido en el puerto 4174, `python check_ui.py` verifica los recorridos previos y `python check_integration.py` verifica el panel integrado, persistencia, controles, propuestas, proyección, estrés, exportación y separación entre entidades, en anchuras de 320 a 1440 píxeles.

## Límites

Estado de resultados de gestión, no contabilidad completa por devengo. Los saldos son declarados. La curva de cobro de 13 semanas del motor original es un escenario simplificado, no un aging de facturas. El pronóstico es estadístico y no garantiza resultados. No se ha certificado el modelo bajo normas contables ni se ejecutan operaciones financieras.

## Resultado verificado

- 76 pruebas Vitest y 10 pruebas Node aprobadas.
- Recorridos anteriores y nuevos comprobados con Playwright, sin errores de JavaScript; persistencia y separación de entidades verificadas.
- Compilación de producción Vite correcta. El módulo de análisis y los gráficos se cargan al abrir Resultados.
- Auditoría completa `npm audit --audit-level=low`: cero vulnerabilidades reportadas, incluidas herramientas de desarrollo. Vitest actualizado a 4.1.12 y Vite a 6.4.5 en el lockfile; los tests originales permanecen activos.
- La base `4ee8ed6` permanece como ancestro de la rama de integración; las páginas históricas y la documentación original permanecen en el código fuente.
