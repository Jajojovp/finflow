/**
 * AnomalyService — flags outliers in revenue, expenses and cash.
 * Uses a 3-sigma rule on each metric, plus a simple MoM change detector.
 */

import MathUtils from '../core/MathUtils';

const METRICS = ['revenue', 'expenses', 'cash'];

function severityFor(z) {
  const abs = Math.abs(z);
  if (abs >= 4) return 'critical';
  if (abs >= 3) return 'warning';
  return 'info';
}

export const AnomalyService = {
  /**
   * @param {Array<object>} series monthly financials
   * @param {{ threshold?: number }} options
   * @returns {Array<{month,metric,value,expected,severity,score}>}
   */
  detect(series, options = {}) {
    const threshold = options.threshold || 3;
    const data = (series || []).filter((d) => d);
    if (data.length < 4) return [];

    const anomalies = [];
    for (const metric of METRICS) {
      const values = data.map((d) => d[metric]).filter((v) => Number.isFinite(v));
      if (values.length < 4) continue;
      const { slope, intercept } = MathUtils.linearTrend(values);
      const sigma = MathUtils.stddev(values) || 0;
      if (!sigma) continue;

      data.forEach((d, i) => {
        const expected = intercept + slope * i;
        const z = sigma ? (d[metric] - expected) / sigma : 0;
        if (Math.abs(z) >= threshold) {
          anomalies.push({
            month: d.month,
            metric,
            value: d[metric],
            expected: MathUtils.round(expected),
            score: MathUtils.round(z, 2),
            severity: severityFor(z),
          });
        }
      });
    }

    // MoM change anomalies (revenue drops > 25% or spikes > 50%).
    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1].revenue;
      const curr = data[i].revenue;
      if (!prev) continue;
      const change = (curr - prev) / Math.abs(prev);
      if (change <= -0.25 || change >= 0.5) {
        const z = change <= -0.25 ? -3.5 : 3.5;
        anomalies.push({
          month: data[i].month,
          metric: 'revenue',
          value: curr,
          expected: MathUtils.round(prev),
          score: MathUtils.round(z, 2),
          severity: severityFor(z),
        });
      }
    }

    // Dedupe by month+metric, keeping the worst score.
    const map = new Map();
    for (const a of anomalies) {
      const key = `${a.month}-${a.metric}`;
      const existing = map.get(key);
      if (!existing || Math.abs(a.score) > Math.abs(existing.score)) {
        map.set(key, a);
      }
    }
    return Array.from(map.values()).sort((a, b) => Math.abs(b.score) - Math.abs(a.score));
  },
};

export default AnomalyService;