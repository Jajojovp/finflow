/**
 * BenchmarkService — compares company metrics against an industry benchmark set.
 */

import MathUtils from '../core/MathUtils';
import KPICalculator from './KPICalculator';

export const BenchmarkService = {
  /**
   * @param {Array<object>} series monthly financials
   * @param {object} benchmarks object of metric -> target value
   * @returns {Array<{metric,company,benchmark,gap,format}>}
   */
  compare(series, benchmarks) {
    const kpis = KPICalculator.fromMonthly(series);
    const bench = benchmarks || {};
    const rows = [];

    const defs = [
      { metric: 'grossMargin', company: kpis.grossMargin, benchmark: bench.grossMargin, format: 'percent' },
      { metric: 'netMargin', company: kpis.netMargin, benchmark: bench.netMargin, format: 'percent' },
      { metric: 'revenueGrowth', company: kpis.revenueGrowth, benchmark: bench.revenueGrowth, format: 'percent' },
      { metric: 'operatingMargin', company: kpis.netMargin, benchmark: bench.operatingMargin, format: 'percent' },
      { metric: 'cashRunway', company: kpis.runwayMonths || 0, benchmark: bench.cashRunway, format: 'number' },
    ];

    for (const def of defs) {
      if (def.benchmark == null) continue;
      const gap = def.format === 'percent'
        ? MathUtils.round(def.company - def.benchmark, 4)
        : MathUtils.round(def.company - def.benchmark);
      rows.push({
        metric: def.metric,
        company: def.company,
        benchmark: def.benchmark,
        gap,
        format: def.format,
      });
    }

    return rows;
  },

  /** Returns a 0-100 score: percentage of benchmarks met or exceeded. */
  score(series, benchmarks) {
    const rows = this.compare(series, benchmarks);
    if (rows.length === 0) return 0;
    const met = rows.filter((r) => r.gap >= 0).length;
    return MathUtils.round((met / rows.length) * 100);
  },
};

export default BenchmarkService;