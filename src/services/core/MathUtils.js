/**
 * MathUtils — pure numeric helpers used across financial services.
 * All functions are side-effect free and defensive against bad input.
 */

export const MathUtils = {
  sum(values) {
    if (!Array.isArray(values) || values.length === 0) return 0;
    return values.reduce((acc, v) => (Number.isFinite(v) ? acc + v : acc), 0);
  },

  mean(values) {
    const n = values?.filter((v) => Number.isFinite(v)).length;
    return n ? this.sum(values) / n : 0;
  },

  median(values) {
    const sorted = [...values].filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
    const n = sorted.length;
    if (n === 0) return 0;
    const mid = Math.floor(n / 2);
    return n % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  },

  variance(values, sample = false) {
    const n = values.filter((v) => Number.isFinite(v)).length;
    if (n < 2) return 0;
    const m = this.mean(values);
    const ssd = values.reduce((acc, v) => (Number.isFinite(v) ? acc + (v - m) ** 2 : acc), 0);
    return ssd / (sample ? n - 1 : n);
  },

  stddev(values, sample = false) {
    return Math.sqrt(this.variance(values, sample));
  },

  /** Z-score of a value against a population. Returns 0 for degenerate sets. */
  zScore(value, values) {
    const sd = this.stddev(values);
    if (!sd) return 0;
    return (value - this.mean(values)) / sd;
  },

  /** Simple linear regression returns slope & intercept based on (x=0..n-1). */
  linearTrend(values) {
    const ys = values.filter((v) => Number.isFinite(v));
    const n = ys.length;
    if (n < 2) return { slope: 0, intercept: ys[0] || 0 };
    const xs = ys.map((_, i) => i);
    const meanX = this.mean(xs);
    const meanY = this.mean(ys);
    const num = xs.reduce((acc, x, i) => acc + (x - meanX) * (ys[i] - meanY), 0);
    const den = xs.reduce((acc, x) => acc + (x - meanX) ** 2, 0);
    const slope = den ? num / den : 0;
    const intercept = meanY - slope * meanX;
    return { slope, intercept };
  },

  /** Percentage change between two numbers. Guards against divide-by-zero. */
  pctChange(prev, curr) {
    if (!Number.isFinite(prev) || prev === 0) return 0;
    return (curr - prev) / Math.abs(prev);
  },

  clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.max(min, Math.min(max, value));
  },

  round(value, decimals = 2) {
    if (!Number.isFinite(value)) return 0;
    const f = 10 ** decimals;
    return Math.round(value * f) / f;
  },
};

export default MathUtils;