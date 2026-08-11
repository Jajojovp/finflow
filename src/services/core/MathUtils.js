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

  /** Percentage change between two numbers. Returns null for degenerate/NaN inputs. */
  pctChange(prev, curr) {
    if (!Number.isFinite(prev) || !Number.isFinite(curr) || prev === 0) return null;
    return (curr - prev) / Math.abs(prev);
  },

  /** Safe division. Returns fallback when denominator is 0, null, or NaN. */
  safeDivide(numerator, denominator, fallback = null) {
    if (denominator === 0 || denominator === null || Number.isNaN(denominator)) return fallback;
    return numerator / denominator;
  },

  /** t_{0.975} quantile for a given degrees of freedom, with linear interpolation. */
  studentTQuantile(dof) {
    const table = {
      2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571, 6: 2.447, 7: 2.365,
      8: 2.306, 9: 2.262, 10: 2.228, 11: 2.201, 12: 2.179, 13: 2.16,
      14: 2.145, 15: 2.131, 16: 2.12, 17: 2.11, 18: 2.101, 19: 2.093,
      20: 2.086, 25: 2.06, 30: 2.042, 40: 2.021,
    };
    if (dof < 2) return 4.303;
    if (dof > 40) return 1.96;
    if (Number.isFinite(dof) && Number.isInteger(dof) && Object.prototype.hasOwnProperty.call(table, dof)) {
      return table[dof];
    }
    const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
    let lo = keys[0];
    let hi = keys[keys.length - 1];
    for (let i = 0; i < keys.length; i++) {
      if (keys[i] <= dof) lo = keys[i];
      if (keys[i] >= dof) { hi = keys[i]; break; }
    }
    if (lo === hi) return table[lo];
    const t = (dof - lo) / (hi - lo);
    return table[lo] + t * (table[hi] - table[lo]);
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