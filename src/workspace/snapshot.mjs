import { validateTransaction } from './core.mjs';
import { isCurrencyCode } from './currencies.mjs';

export const BACKUP_FORMAT = 'finflow-backup-v2';
export const MAX_BACKUP_BYTES = 4 * 1024 * 1024;
const profiles = ['personal', 'business', 'advisor'];
const object = value => !!value && typeof value === 'object' && !Array.isArray(value);
const month = value => typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
const amount = value => Number.isFinite(value) && value >= 0 && value <= 1e12;
const fail = message => { throw new Error(message); };
const validScope = value => value === 'local' || (typeof value === 'string' && /^google:[A-Za-z0-9_-]{1,128}$/.test(value));

// Hermes does not require a TextEncoder polyfill just to check a backup's size.
export function utf8Bytes(text) {
  let size = 0;
  for (const c of text) size += c.length === 2 ? 4 : c.charCodeAt(0) < 128 ? 1 : c.charCodeAt(0) < 2048 ? 2 : 3;
  return size;
}
function jsonData(value, depth = 0) {
  if (depth > 40) fail('El respaldo contiene demasiados niveles de datos.');
  if (typeof value === 'number' && !Number.isFinite(value)) fail('Hay valores numéricos inválidos en el respaldo.');
  if (value === null || ['string', 'number', 'boolean', 'undefined'].includes(typeof value)) return;
  if (typeof value !== 'object' || (!Array.isArray(value) && ![Object.prototype, null].includes(Object.getPrototypeOf(value)))) fail('El respaldo solo admite datos JSON.');
  for (const [key, item] of Object.entries(value)) {
    if (key === '__proto__') fail('El respaldo contiene una clave no admitida.');
    jsonData(item, depth + 1);
  }
}
export function scopeFromStorageKey(key) {
  const index = key.indexOf(':google:');
  const scope = index < 0 ? 'local' : key.slice(index + 1);
  if (!validScope(scope)) fail('El espacio de datos no es válido.');
  return scope;
}
function record(value, label) {
  if (!object(value)) fail(`Revisa ${label} del respaldo.`);
  return value;
}
function numericMap(value, label, nullable = false) {
  record(value, label);
  for (const n of Object.values(value)) if (!(nullable && n === null) && (!Number.isFinite(n) || Math.abs(n) > 1e12)) fail(`Revisa ${label} del respaldo.`);
}
function rows(value, ids, legacy) {
  if (!Array.isArray(value) || value.length > 5000) fail('Cada espacio admite hasta 5.000 movimientos activos y 5.000 archivados.');
  return value.map(row => {
    record(row, 'los movimientos');
    if (typeof row.id !== 'string' || !row.id || row.id.length > 100 || ids.has(row.id)) fail('El respaldo contiene identificadores de movimientos inválidos o repetidos.');
    ids.add(row.id);
    const checked = validateTransaction(row);
    const result = { ...row, ...checked };
    if (legacy && !result.financialType && result.source === 'Datos de ejemplo') {
      result.financialType = result.type === 'ingreso' ? 'revenue' : result.category === 'Proveedores' ? 'cogs' : 'opex';
      if (result.type === 'gasto') result.behavior = ['Proveedores', 'Marketing', 'Operaciones', 'Compra', 'Ocio', 'Transporte'].includes(result.category) ? 'variable' : 'fixed';
    }
    const allowed = result.type === 'ingreso' ? ['revenue', 'other_income', 'capital'] : ['opex', 'cogs', 'depreciation', 'interest', 'tax', 'capital', 'unclassified'];
    if (result.financialType && !allowed.includes(result.financialType)) fail('La clasificación no corresponde al tipo de movimiento.');
    if (result.behavior && !['fixed', 'variable'].includes(result.behavior)) fail('Hay un comportamiento de gasto inválido.');
    if (result.source !== undefined && typeof result.source !== 'string') fail('Hay una fuente de movimiento inválida.');
    return result;
  });
}
function workspace(value, key, legacy) {
  const d = record(value, 'el espacio');
  const defaults = { personal: 'Mi espacio personal', business: 'Estudio Norte' };
  const name = d.name ?? defaults[key] ?? ['Estudio Norte', 'Taller Oliva', 'Café Alameda'][Number(key.slice(8))] ?? `Cliente ${Number(key.slice(8)) + 1}`;
  if (typeof name !== 'string' || name.length > 200) fail('El nombre del espacio es inválido.');
  const currency = d.currency ?? (legacy ? 'EUR' : null);
  if (!isCurrencyCode(currency)) fail('Revisa la moneda del respaldo.');
  const goal = record(d.goal, 'el objetivo');
  if (typeof goal.name !== 'string' || goal.name.length > 200 || !amount(goal.target) || goal.target <= 0 || !amount(goal.saved)) fail('Revisa el objetivo y sus importes.');
  if (!Array.isArray(d.lessons) || d.lessons.some(n => !Number.isInteger(n) || n < 0 || n >= 5)) fail('Hay progreso de aprendizaje inválido.');
  const finance = record(d.finance ?? {}, 'los parámetros mensuales');
  for (const [period, v] of Object.entries(finance)) {
    if (!month(period) || !object(v) || !Number.isFinite(v.opening) || Math.abs(v.opening) > 1e12 || !amount(v.expenseBudget) || !amount(v.unitPrice) || !Number.isFinite(v.savingsTarget) || v.savingsTarget < 0 || v.savingsTarget > 100) fail('Hay parámetros mensuales inválidos en el respaldo.');
  }
  const budgets = record(d.budgets ?? {}, 'los presupuestos');
  if (Object.values(budgets).some(n => !amount(n))) fail('Hay presupuestos inválidos en el respaldo.');
  const analysis = record(d.analysis ?? {}, 'el análisis');
  for (const name of ['targets', 'limits', 'revenueBudgets']) if (analysis[name] !== undefined) numericMap(analysis[name], name, true);
  if (analysis.balances !== undefined) {
    record(analysis.balances, 'los balances');
    for (const [period, values] of Object.entries(analysis.balances)) {
      if (!month(period)) fail('Hay una fecha de balance inválida.');
      numericMap(values, 'el balance', true);
    }
  }
  const identifiers = new Set();
  const result = { ...d, name, currency, rows: rows(d.rows, identifiers, legacy), trash: rows(d.trash ?? [], identifiers, legacy), goal, finance, budgets, analysis };
  if (d.demoArchive !== undefined) {
    record(d.demoArchive, 'los ejemplos archivados');
    result.demoArchive = { ...d.demoArchive, rows: rows(d.demoArchive.rows, new Set(), legacy) };
  }
  return result;
}
export function normalizeSnapshotState(value, { legacy = false } = {}) {
  record(value, 'el estado'); jsonData(value);
  const state = JSON.parse(JSON.stringify(value));
  const profile = state.profile ?? (legacy ? 'personal' : null);
  const period = state.period ?? state.month;
  const entity = state.entity ?? (legacy ? 0 : null);
  if (state.version !== undefined && state.version !== 1) fail('La versión del estado no es compatible.');
  if (!profiles.includes(profile) || !month(period) || !Number.isInteger(entity) || entity < 0 || entity > 99) fail('Revisa el perfil, cliente y período del respaldo.');
  const datasets = record(state.datasets, 'los espacios');
  if (Object.keys(datasets).length > 102) fail('El respaldo contiene demasiados espacios.');
  for (const key of Object.keys(datasets)) {
    if (!/^(personal|business|advisor-(\d|[1-9]\d))$/.test(key)) fail('El respaldo contiene un espacio desconocido.');
    datasets[key] = workspace(datasets[key], key, legacy);
  }
  if (state.theme !== undefined && !['light', 'dark'].includes(state.theme)) fail('Hay una apariencia inválida en el respaldo.');
  if (state.previewCurrency !== undefined && !isCurrencyCode(state.previewCurrency)) fail('La moneda de la portada es inválida.');
  return { ...state, version: 1, profile, period, entity, onboarded: !!state.onboarded, datasets };
}
export function encodeSnapshot(state, { source = 'web', scope = 'local' } = {}) {
  if (!['web', 'mobile'].includes(source) || !validScope(scope)) fail('El origen del respaldo no es válido.');
  const normalized = normalizeSnapshotState(state, { legacy: source === 'web' });
  const raw = JSON.stringify({ format: BACKUP_FORMAT, schemaVersion: 2, source, scope, exportedAt: new Date().toISOString(), state: normalized }, null, 2);
  if (utf8Bytes(raw) > MAX_BACKUP_BYTES) fail('El respaldo supera el límite de 4 MB.');
  return raw;
}
export function decodeSnapshot(raw, { scope } = {}) {
  if (typeof raw !== 'string' || raw.length > MAX_BACKUP_BYTES || utf8Bytes(raw) > MAX_BACKUP_BYTES) fail('El respaldo debe ocupar menos de 4 MB.');
  let parsed;
  try { parsed = JSON.parse(raw.replace(/^\uFEFF/, '')); } catch { fail('El archivo no contiene un respaldo JSON válido.'); }
  record(parsed, 'el formato'); jsonData(parsed);
  let state, source, owner = null, legacy = true;
  if (parsed.format === BACKUP_FORMAT) {
    if (parsed.schemaVersion !== 2 || !['web', 'mobile'].includes(parsed.source) || !validScope(parsed.scope)) fail('La versión o el formato del respaldo no es compatible.');
    ({ state, source } = parsed); owner = parsed.scope; legacy = false;
    if (scope !== undefined && scope !== owner) fail('El respaldo pertenece a otra cuenta o espacio local.');
  } else if (parsed.format === 'finflow-mobile-v1' && parsed.state?.version === 1) {
    state = parsed.state; source = 'mobile';
  } else if (parsed.format === undefined && object(parsed.datasets) && month(parsed.month)) {
    state = parsed; source = 'web';
  } else fail('El archivo no tiene un formato de respaldo de FinFlow compatible.');
  return { state: normalizeSnapshotState(state, { legacy }), source, scope: owner, legacy, exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : null };
}
export function toWebState(state) {
  return { ...state, month: state.period, theme: state.theme ?? 'light', previewCurrency: state.previewCurrency ?? 'EUR' };
}
export function snapshotSummary(state) {
  const datasets = Object.values(state.datasets);
  return { workspaces: datasets.length, movements: datasets.reduce((n, d) => n + d.rows.length, 0), archived: datasets.reduce((n, d) => n + (d.trash?.length ?? 0), 0), currencies: [...new Set(datasets.map(d => d.currency))].sort() };
}
