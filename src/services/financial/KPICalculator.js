/**
 * KPICalculator — derives headline financial KPIs from a monthly series.
 * Returns plain objects so results are easy to test and serialize.
 */

import MathUtils from '../core/MathUtils';

export const KPICalculator = {
  /**
   * Build a KPI snapshot from a monthly financial series.
   * @param {Array<{month:string, revenue:number, expenses:number, cash:number, budget?:number}>} series
   */
  fromMonthly(series) {
    const data = (series || []).filter((d) => d && Number.isFinite(d.revenue));
    if (data.length === 0) {
      return this._empty();
    }

    const totalRevenue = MathUtils.sum(data.map((d) => d.revenue));
    const totalExpenses = MathUtils.sum(data.map((d) => d.expenses));
    const netIncome = totalRevenue - totalExpenses;
    const grossProfit = totalRevenue * 0.7; // placeholder COGS 30%
    const grossMargin = totalRevenue ? grossProfit / totalRevenue : 0;
    const netMargin = totalRevenue ? netIncome / totalRevenue : 0;

    const last = data[data.length - 1];
    const prev = data[data.length - 2] || last;
    const revenueGrowth = MathUtils.pctChange(prev.revenue, last.revenue);
    const marginDelta = MathUtils.pctChange(netMargin || 0, netMargin);

    const monthlyBurn = MathUtils.mean(data.slice(-6).map((d) => d.expenses - d.revenue));
    const cashPosition = last.cash;
    const runwayMonths = monthlyBurn < 0 ? cashPosition / Math.abs(monthlyBurn) : Infinity;

    return {
      totalRevenue,
      totalExpenses,
      netIncome,
      grossProfit,
      grossMargin,
      netMargin,
      revenueGrowth,
      marginDelta,
      cashPosition,
      monthlyBurn,
      runwayMonths: Number.isFinite(runwayMonths) ? MathUtils.round(runwayMonths, 1) : null,
      periodStart: data[0].month,
      periodEnd: last.month,
    };
  },

  /** Return derived ratios for a single period record. */
  ratiosFor(record) {
    if (!record) return {};
    const currentAssets = record.cash || 0;
    const currentLiabilities = Math.max(record.expenses || 0, 1);
    return {
      currentRatio: MathUtils.round(currentAssets / currentLiabilities, 2),
      operatingMargin: record.revenue ? MathUtils.round((record.revenue - record.expenses) / record.revenue, 4) : 0,
      burnRate: MathUtils.round((record.expenses || 0) - (record.revenue || 0)),
    };
  },

  _empty() {
    return {
      totalRevenue: 0,
      totalExpenses: 0,
      netIncome: 0,
      grossProfit: 0,
      grossMargin: 0,
      netMargin: 0,
      revenueGrowth: 0,
      marginDelta: 0,
      cashPosition: 0,
      monthlyBurn: 0,
      runwayMonths: null,
      periodStart: null,
      periodEnd: null,
    };
  },
};

export default KPICalculator;