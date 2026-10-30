import { CURRENCIES } from './currency-catalog.mjs';
export { CURRENCIES };

const catalog = new Map(CURRENCIES.map(entry => [entry.code, entry]));
const preferred = ['CLP', 'ARS', 'USD', 'CAD', 'EUR'];
export const currencyOptions = [
  ...preferred.flatMap(code => { const entry = catalog.get(code); return entry ? [entry] : []; }),
  ...CURRENCIES.filter(entry => !preferred.includes(entry.code)).sort((a, b) => a.name.localeCompare(b.name, 'es')),
];
export const isCurrencyCode = code => typeof code === 'string' && catalog.has(code);
export const currencyDigits = code => catalog.get(code)?.digits ?? 2;
export const currencyStep = code => String(10 ** -currencyDigits(code));
const normalize = text => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export const searchCurrencies = query => {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  return currencyOptions.filter(entry => words.every(word => normalize(`${entry.code} ${entry.name}`).includes(word)));
};
export function changeCurrency(workspace, code) {
  if (!isCurrencyCode(code)) throw new Error('Selecciona una moneda válida del catálogo.');
  // Changing the unit never applies an invented exchange rate or rewrites records.
  return { ...workspace, currency: code };
}
const formatters = new Map();
export function formatMoney(value, currency = 'EUR', { locale = 'es-CL', compact = false, sign = false } = {}) {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  const code = isCurrencyCode(currency) ? currency : 'EUR';
  const key = `${locale}:${code}:${compact}:${sign}`;
  if (!formatters.has(key)) formatters.set(key, new Intl.NumberFormat(locale, {
    style: 'currency', currency: code, currencyDisplay: 'code', useGrouping: true,
    minimumFractionDigits: compact ? 0 : currencyDigits(code),
    maximumFractionDigits: compact ? 1 : currencyDigits(code),
    ...(compact ? { notation: 'compact' } : {}),
    ...(sign ? { signDisplay: 'exceptZero' } : {}),
  }));
  return formatters.get(key).format(Object.is(Number(value), -0) ? 0 : Number(value));
}
export function currencyMath(currency = 'EUR') {
  // Preserve legacy fractional amounts when switching to a zero-decimal unit.
  const scale = 10 ** Math.max(2, currencyDigits(currency));
  const round = n => Math.round((n + Number.EPSILON) * scale) / scale;
  const sum = rows => rows.reduce((n, row) => n + Math.round(row.amount * scale), 0) / scale;
  return { round, sum };
}
