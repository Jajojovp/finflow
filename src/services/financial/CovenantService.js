/**
 * CovenantService — evaluates financial covenants against a period's values.
 *
 * Covenant shape: { id, name, metric, operator, threshold, severity, format? }
 * Operators: '>=', '<=', '>', '<', '==', '!='
 */

const OPERATORS = {
  '>=': (a, b) => a >= b,
  '<=': (a, b) => a <= b,
  '>': (a, b) => a > b,
  '<': (a, b) => a < b,
  '==': (a, b) => a === b,
  '!=': (a, b) => a !== b,
};

function resolveMetric(metric, record, kpis) {
  if (record && Object.prototype.hasOwnProperty.call(record, metric)) return record[metric];
  if (kpis && Object.prototype.hasOwnProperty.call(kpis, metric)) return kpis[metric];
  return undefined;
}

export const CovenantService = {
  /**
   * @param {object} period latest period record
   * @param {Array<object>} covenants
   * @returns {{ total:number, passed:number, breaches:Array, warnings:Array, results:Array }}
   */
  evaluate(period, covenants) {
    const list = Array.isArray(covenants) ? covenants : [];
    const results = list.map((c) => {
      const actual = resolveMetric(c.metric, period);
      const isNumeric = Number.isFinite(actual);
      const passed = isNumeric ? Boolean(OPERATORS[c.operator]?.(actual, c.threshold)) : false;
      const ratio = isNumeric && c.threshold ? actual / c.threshold : null;
      let status = 'passed';
      if (!passed) {
        status = c.severity === 'critical' ? 'breach' : 'warning';
        if (ratio != null && c.operator === '>=' && ratio >= 0.9) status = 'warning';
        if (ratio != null && c.operator === '<=' && ratio <= 1.1) status = 'warning';
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