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

  /**
   * Cumulative cash run over the series.
   * Month i=0 starts from the initial cash value; each subsequent month
   * accumulates the net flow (revenue - expenses) on top of the running cash.
   */
  cumulative(series) {
    if (!series?.length) return [];
    let running = series[0].cash || 0;
    return series.map((d, i) => {
      if (i > 0) running += (d.revenue || 0) - (d.expenses || 0);
      return { label: d.month?.slice(5), month: d.month, cash: running };
    });
  },

  /**
   * 13-week stress projection: apply a revenue shock, an expense inflation and
   * a collection delay to forecast ending cash.
   *
   * Collection is modeled with an accumulated exponential curve
   * `collectionCurve = 1 - exp(-w / DSO_weeks)`, so the fraction of receivables
   * actually collected grows smoothly toward 1 as the week approaches the
   * effective days-sales-outstanding horizon instead of flipping on/off at a
   * hard threshold. Weekly revenue/expenses derive from the last monthly
   * observation using the 12/52 monthly-to-weekly divisor (~4.345 weeks/month).
   */
  stressTest(series, options = {}) {
    const { revenueShock = 0, expenseInflation = 0, collectionDelayWeeks = 0 } = options;
    const last = series[series.length - 1];
    if (!last) return null;
    const weeks = 13;
    const DSO_weeks = Number.isFinite(collectionDelayWeeks) && collectionDelayWeeks > 0 ? collectionDelayWeeks : 4;
    let cash = last.cash || 0;
    const weeklyRevenue = (last.revenue || 0) * 12 / 52;
    const weeklyExpenses = (last.expenses || 0) * 12 / 52;
    const trajectory = [{ week: 0, cash }];
    for (let w = 1; w <= weeks; w++) {
      const collectionCurve = 1 - Math.exp(-w / DSO_weeks);
      const collected = weeklyRevenue * (1 + revenueShock) * collectionCurve;
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