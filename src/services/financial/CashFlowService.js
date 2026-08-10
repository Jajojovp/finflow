/**
 * CashFlowService — cash flow projections and net flow series.
 */

import MathUtils from '../core/MathUtils';

export const CashFlowService = {
  /** Net flow per month: revenue - expenses. */
  monthlyNetFlow(series) {
    return (series || []).map((d) => ({
      label: d.month?.slice(5),
      month: d.month,
      net: (d.revenue || 0) - (d.expenses || 0),
    }));
  },

  /** Cumulative cash run over the series starting from the first cash value. */
  cumulative(series) {
    if (!series?.length) return [];
    let running = series[0].cash || 0;
    return series.map((d, i) => {
      if (i > 0) running += (d.revenue || 0) - (d.expenses || 0);
      return { label: d.month?.slice(5), month: d.month, cash: running };
    });
  },

  /**
   * Simple 13-week style stress projection: apply a revenue shock and a
   * collection delay to forecast ending cash.
   */
  stressTest(series, options = {}) {
    const { revenueShock = 0, expenseInflation = 0, collectionDelayWeeks = 0 } = options;
    const last = series[series.length - 1];
    if (!last) return null;
    const weeks = 13;
    let cash = last.cash || 0;
    const weeklyRevenue = (last.revenue || 0) / 4;
    const weeklyExpenses = (last.expenses || 0) / 4;
    const trajectory = [{ week: 0, cash }];
    for (let w = 1; w <= weeks; w++) {
      const collected = w > Math.round(collectionDelayWeeks) ? weeklyRevenue * (1 + revenueShock) : 0;
      const burned = weeklyExpenses * (1 + expenseInflation);
      cash += collected - burned;
      trajectory.push({ week: w, cash: MathUtils.round(cash) });
    }
    const minCash = Math.min(...trajectory.map((p) => p.cash));
    return { weeks, trajectory, minCash, startingCash: last.cash || 0, endingCash: cash };
  },

  /** Average net flow over a trailing window. */
  averageNetFlow(series, windowMonths = 3) {
    const flows = (series || []).slice(-windowMonths).map((d) => (d.revenue || 0) - (d.expenses || 0));
    return MathUtils.mean(flows);
  },
};

export default CashFlowService;