import { validateTransaction } from './core.mjs';
import { currencyMath } from './currencies.mjs';

export const fail = message => { throw new Error(message); };
export function date(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) fail('La fecha debe ser válida y usar AAAA-MM-DD.');
  return value;
}
export function text(value, label = 'nombre', max = 200) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) fail(`Revisa ${label} (máximo ${max} caracteres).`);
  return value.trim();
}
export function identifier(value) { return text(value, 'el identificador', 64); }
export function amount(value, { positive = false } = {}) {
  if (!Number.isFinite(value) || value < 0 || value > 1e12 || (positive && value <= 0)) fail('Revisa el importe; debe ser finito, positivo o cero y hasta un billón.');
  return value;
}
export function changePlan(d, field, value) { return { ...d, planning: { ...d.planning, [field]: value } }; }
export function upsert(d, field, item) {
  identifier(item.id);
  const list = d.planning?.[field] ?? [];
  if (!Array.isArray(list) || list.length > 500 || (!list.some(x => x.id === item.id) && list.length === 500)) fail('Cada módulo admite hasta 500 registros.');
  return changePlan(d, field, [...list.filter(x => x.id !== item.id), item]);
}
export function addRows(d, rows) {
  const occupied = new Set([...(d.rows ?? []), ...(d.trash ?? [])].map(r => r.id));
  if (rows.some(r => occupied.has(r.id)) || new Set(rows.map(r => r.id)).size !== rows.length) fail('El identificador del movimiento ya está utilizado.');
  if ((d.rows?.length ?? 0) + rows.length > 5000) fail('El espacio admite hasta 5.000 movimientos.');
  const { round } = currencyMath(d.currency);
  return { ...d, rows: [...d.rows, ...rows.map(r => validateTransaction({ ...r, amount: round(r.amount) }))] };
}
export function linkedRowIds(d) {
  return new Set([...(d.planning?.debts ?? []).flatMap(x => (x.payments ?? []).flatMap(p => p.rowIds)), ...(d.planning?.dues ?? []).flatMap(x => x.paymentRowIds ?? [])]);
}
export function addDays(value, days) { return new Date(Date.parse(date(value)) + days * 86400000).toISOString().slice(0, 10); }
export function priorMonth(period) { const d = new Date(date(period + '-01')); d.setUTCMonth(d.getUTCMonth() - 1); return d.toISOString().slice(0, 7); }
