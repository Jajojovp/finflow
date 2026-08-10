// FinFlow formatting utilities — fintech-grade, locale-aware (en-US by default).
// Used by MetricCard and other display components.

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const USD_COMPACT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const NUMBER = new Intl.NumberFormat('en-US');

const NUMBER_COMPACT = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const fmt = {
  // Currency: 1234.5 -> "$1,234.50"
  currency: (v, { sign = false } = {}) => {
    if (v == null || Number.isNaN(Number(v))) return '—';
    const n = Number(v);
    const s = USD.format(Math.abs(n));
    if (sign && n > 0) return `+${s}`;
    return n < 0 ? `-${s}` : s;
  },

  // Percent: 0.123 -> "12.30%" (input is a ratio). Pass { raw: true } to treat input as already-percent.
  percent: (v, { decimals = 2, raw = false } = {}) => {
    if (v == null || Number.isNaN(Number(v))) return '—';
    const n = Number(v);
    const pct = raw ? n : n * 100;
    return `${pct.toFixed(decimals)}%`;
  },

  // Plain number: 1234567 -> "1,234,567"
  number: (v) => {
    if (v == null || Number.isNaN(Number(v))) return '—';
    return NUMBER.format(Number(v));
  },

  // Compact: 1234567 -> "1.2M"
  compact: (v) => {
    if (v == null || Number.isNaN(Number(v))) return '—';
    return NUMBER_COMPACT.format(Number(v));
  },

  // Compact currency: 1234567 -> "$1.2M"
  currencyCompact: (v) => {
    if (v == null || Number.isNaN(Number(v))) return '—';
    return USD_COMPACT.format(Number(v));
  },

  // Date: ISO/date -> "MMM d, yyyy"
  date: (v) => {
    if (v == null) return '—';
    const d = v instanceof Date ? v : new Date(v);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },
};

export default fmt;
