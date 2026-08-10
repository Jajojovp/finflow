/**
 * VarianceService — actual vs budget analysis.
 */

import MathUtils from '../core/MathUtils';

export const VarianceService = {
  /**
   * @param {Array<{month, revenue, budget?}>} series
   * @returns {Array<{month, budget, actual, variance, pct}>}
   */
  monthly(series) {
    return (series || [])
      .filter((d) => d && d.budget != null && Number.isFinite(d.revenue))
      .map((d) => {
        const variance = (d.revenue || 0) - (d.budget || 0);
        const pct = d.budget ? variance / Math.abs(d.budget) : 0;
        return {
          month: d.month,
          budget: d.budget,
          actual: d.revenue,
          variance: MathUtils.round(variance),
          pct: MathUtils.round(pct, 4),
        };
      });
  },

  /** Aggregate variance stats across all months that have a budget. */
  summary(series) {
    const rows = this.monthly(series);
    if (rows.length === 0) return null;
    const totalVar = MathUtils.sum(rows.map((r) => r.variance));
    const totalBudget = MathUtils.sum(rows.map((r) => r.budget));
    return {
      months: rows.length,
      totalBudget,
      totalActual: MathUtils.sum(rows.map((r) => r.actual)),
      totalVariance: MathUtils.round(totalVar),
      totalPct: totalBudget ? MathUtils.round(totalVar / Math.abs(totalBudget), 4) : 0,
      favorable: rows.filter((r) => r.variance >= 0).length,
      unfavorable: rows.filter((r) => r.variance < 0).length,
    };
  },
};

export default VarianceService;