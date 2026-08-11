/**
 * CovenantService — evalúa covenants financieros contra un período.
 *
 * Covenant shape: { id, name, metric, operator, threshold, severity, format? }
 *  - severity: 'critical' → 'breach' | 'warning' | 'info' → 'warning'
 * Operadores: '>=', '<=', '>', '<', '==' (comparación numérica).
 *
 * FASE 0 (spec §9): la resolución de métrica sigue fall-closed (spec §2 D2):
 *   resolveMetric: 1) dato finito en `period` → period[metric];
 *                  2) dato finito en `kpis` → kpis[metric];
 *                  3) en otro caso → null.
 * Un actual null NUNCA produce breach/warning: la fila queda en status
 * 'unknown' con reason 'dato no disponible'.
 *
 * Comunicación: emite 'covenant.breach' al EventBus por cada breach
 * (payload { id, metric, ... }), patrón compatible con NotificationService.
 */

import EventBus from '../core/EventBus';

const OPERATORS = {
  '>=': (a, b) => a >= b,
  '<=': (a, b) => a <= b,
  '>': (a, b) => a > b,
  '<': (a, b) => a < b,
  '==': (a, b) => a === b,
};

/**
 * Resuelve el valor real de una métrica de covenant.
 * 1) Número finito en period[metric]; 2) número finito en kpis[metric];
 * 3) null. Nunca undefined.
 */
function resolveMetric(metric, period, kpis) {
  if (period && Number.isFinite(period[metric])) return period[metric];
  if (kpis && Number.isFinite(kpis[metric])) return kpis[metric];
  return null;
}

export const CovenantService = {
  /**
   * Evalúa una lista de covenants contra un período (y KPIs opcionales).
   * @param {object} period registro del período más reciente (ej. último mes)
   * @param {Array<object>} covenants
   * @param {object|null} kpis snapshot de KPICalculator.fromMonthly
   * @returns {{ total:number, passed:number, breaches:Array, warnings:Array, results:Array }}
   */
  evaluate(period, covenants, kpis = null) {
    const list = Array.isArray(covenants) ? covenants : [];
    const results = list.map((c) => {
      const actual = resolveMetric(c.metric, period, kpis);
      const isNumeric = actual != null && Number.isFinite(actual);
      const operatorFn = OPERATORS[c.operator];

      let status;
      let reason;
      if (!isNumeric) {
        status = 'unknown';
        reason = 'dato no disponible';
      } else if (operatorFn && operatorFn(actual, c.threshold)) {
        status = 'passed';
        reason = 'ok';
      } else if (!operatorFn) {
        status = 'unknown';
        reason = 'operador no soportado';
      } else {
        status = c.severity === 'critical' ? 'breach' : 'warning';
        reason = `no cumple ${c.operator} ${c.threshold}`;
      }

      if (status === 'breach') {
        EventBus.emit('covenant.breach', {
          id: c.id,
          name: c.name,
          metric: c.metric,
          operator: c.operator,
          threshold: c.threshold,
          actual,
        });
      }

      return {
        id: c.id,
        name: c.name,
        metric: c.metric,
        operator: c.operator,
        threshold: c.threshold,
        actual,
        format: c.format || 'number',
        status,
        reason,
      };
    });

    const breaches = results.filter((r) => r.status === 'breach');
    const warnings = results.filter((r) => r.status === 'warning');
    return {
      total: list.length,
      passed: results.filter((r) => r.status === 'passed').length,
      breaches,
      warnings,
      results,
    };
  },
};

export default CovenantService;
