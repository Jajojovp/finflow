/**
 * ForecastingService — trend-and-seasonality projection with confidence bands.
 *
 * Approach:
 *  1. Decompose the series into a linear trend (least squares).
 *  2. Estimate monthly seasonality as average ratio of each month value
 *     to the trend line.
 *  3. Project forward; confidence band scales with the residual stddev.
 *
 * Not a substitute for a real econometrics library, but deterministic
 * and dependency-free for the FinFlow demo.
 */

import MathUtils from '../core/MathUtils';

export const ForecastingService = {
  /**
   * @param {Array<{month:string, revenue:number}>} series
   * @param {{ horizon?: number, confidence?: number, metric?: string }} options
   * @returns {{ points: Array, method: string, expectedGrowth: number }}
   */
  forecast(series, options = {}) {
    const horizon = Math.max(1, options.horizon || 6);
    const confidence = MathUtils.clamp(options.confidence == null ? 1.96 : options.confidence, 0, 3);
    const metric = options.metric || 'revenue';

    const data = (series || []).filter((d) => d && Number.isFinite(d[metric]));
    if (data.length < 3) {
      return { points: [], method: 'insufficient-data', expectedGrowth: 0 };
    }

    const values = data.map((d) => d[metric]);
    const { slope, intercept } = MathUtils.linearTrend(values);
    const residuals = values.map((v, i) => v - (intercept + slope * i));
    const sigma = MathUtils.stddev(residuals) || 0;

    // Seasonality: ratio of actual to trend, per calendar month.
    const seasonalRatios = {};
    const seasonalCounts = {};
    data.forEach((d, i) => {
      const m = Number(d.month.slice(5));
      const trend = intercept + slope * i;
      const ratio = trend ? d[metric] / trend : 1;
      seasonalRatios[m] = (seasonalRatios[m] || 0) + ratio;
      seasonalCounts[m] = (seasonalCounts[m] || 0) + 1;
    });
    Object.keys(seasonalRatios).forEach((m) => {
      seasonalRatios[m] = seasonalRatios[m] / seasonalCounts[m];
    });

    const last = data[data.length - 1];
    const lastDate = new Date(last.month + '-01');
    const points = [];
    for (let h = 1; h <= horizon; h++) {
      const future = new Date(lastDate.getFullYear(), lastDate.getMonth() + h, 1);
      const monthVal = future.getMonth() + 1;
      const idx = data.length - 1 + h;
      const trend = intercept + slope * idx;
      const seasonal = seasonalRatios[monthVal] || 1;
      const value = Math.max(0, trend * seasonal);
      const band = sigma * confidence * Math.sqrt(1 + 1 / data.length + ((idx - (data.length - 1)) ** 2) / data.length);
      points.push({
        month: `${future.getFullYear()}-${String(monthVal).padStart(2, '0')}`,
        value: MathUtils.round(value),
        lower: MathUtils.round(Math.max(0, value - band)),
        upper: MathUtils.round(value + band),
      });
    }

    const expectedGrowth = last.revenue ? MathUtils.pctChange(last.revenue, points[0]?.value || 0) : 0;

    return {
      points,
      method: 'linear-trend + monthly seasonality',
      expectedGrowth: MathUtils.round(expectedGrowth, 4),
      sigma: MathUtils.round(sigma),
      slope: MathUtils.round(slope),
    };
  },
};

export default ForecastingService;