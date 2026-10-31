// FinFlow formatting utilities — fintech-grade, locale-aware (en-US by default).
// Used by MetricCard and other display components.

import { formatMoney } from '../workspace/currencies.mjs';

const CURRENCY_SYMBOLS = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥', KRW: '₩',
  INR: '₹', BRL: 'R$', MXN: 'MX$', CAD: 'CA$', AUD: 'A$',
  CHF: 'CHF', SEK: 'kr', NOK: 'kr', DKK: 'kr', PLN: 'zł',
  CZK: 'Kč', HUF: 'Ft', RON: 'lei', TRY: '₺', RUB: '₽',
  ZAR: 'R', SGD: 'S$', HKD: 'HK$', NZD: 'NZ$', THB: '฿',
  IDR: 'Rp', MYR: 'RM', PHP: '₱', VND: '₫', EGP: 'E£',
  AED: 'د.إ', SAR: '﷼', ILS: '₪', NGN: '₦', KES: 'KSh',
  ARS: 'AR$', COP: 'COL$', CLP: 'CL$', PEN: 'S/',
};

const NUMBER = new Intl.NumberFormat('en-US');

const NUMBER_COMPACT = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const getCurrencySymbol = (currency = 'USD') => CURRENCY_SYMBOLS[currency] || currency;

export const fmt = {
  // Currency: 1234.5 -> "$1,234" (USD default, parametrizable by currency)
  currency: (v, { sign = false, currency = 'USD' } = {}) => formatMoney(v, currency, { locale: 'en-US', sign }),

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
  currencyCompact: (v, { currency = 'USD' } = {}) => formatMoney(v, currency, { locale: 'en-US', compact: true }),

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
