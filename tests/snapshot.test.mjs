import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeSnapshot, decodeSnapshot, snapshotSummary, scopeFromStorageKey, toWebState } from '../src/workspace/snapshot.mjs';

const workspace = (currency = 'CLP') => ({
  name: 'Cliente Ñandú', currency,
  rows: [{ id: 'venta-1', date: '2026-10-02', description: 'Venta', category: 'Ventas', type: 'ingreso', amount: 100000, financialType: 'revenue', source: 'Manual', extra: { reference: 'A-10' } }],
  trash: [{ id: 'archivo-1', date: '2026-10-01', description: 'Archivado', category: 'Otros', type: 'gasto', amount: 10, financialType: 'opex' }],
  goal: { name: 'Reserva', target: 1000000, saved: 200000 }, lessons: [0, 3],
  finance: { '2026-10': { opening: -100, savingsTarget: 20, expenseBudget: 2000, unitPrice: 100 } },
  budgets: { Transporte: 300 }, analysis: { targets: { netMargin: 0.2 }, decisions: { reviewed: { status: 'accepted' } } },
  futureModule: { preserved: true },
});
const state = () => ({ version: 1, onboarded: true, profile: 'advisor', entity: 3, period: '2026-10', datasets: { personal: workspace('ARS'), 'advisor-3': workspace('CLP') }, theme: 'light', customPreference: 'keep' });

test('round-trips the complete state, all workspace fields and stable identifiers without changing the input', () => {
  const original = state(), before = structuredClone(original);
  const raw = encodeSnapshot(original, { source: 'mobile', scope: 'google:owner-1' });
  const decoded = decodeSnapshot(raw, { scope: 'google:owner-1' });
  assert.equal(JSON.parse(raw).schemaVersion, 2);
  assert.equal(decoded.legacy, false);
  assert.equal(decoded.scope, 'google:owner-1');
  assert.deepEqual(decoded.state.datasets, original.datasets);
  assert.equal(decoded.state.customPreference, 'keep');
  assert.deepEqual(original, before);
  assert.deepEqual(snapshotSummary(decoded.state).currencies, ['ARS', 'CLP']);
  assert.equal(snapshotSummary(decoded.state).movements, 2);
  assert.equal(snapshotSummary(decoded.state).archived, 2);
});

test('reads existing mobile v1 backups and marks their ownership as unspecified', () => {
  const original = state();
  const decoded = decodeSnapshot(JSON.stringify({ format: 'finflow-mobile-v1', exportedAt: '2026-10-01T00:00:00Z', state: original }), { scope: 'google:owner-1' });
  assert.equal(decoded.legacy, true);
  assert.equal(decoded.scope, null);
  assert.deepEqual(decoded.state.datasets, original.datasets);
});

test('adapts existing web storage without a version and keeps demo classifications and configuration', () => {
  const old = { month: '2026-09', entity: 0, theme: 'dark', previewCurrency: 'CAD', datasets: { business: { rows: [{ id: 'seed-1', date: '2026-09-01', description: 'Proveedor', category: 'Proveedores', type: 'gasto', amount: 10, source: 'Datos de ejemplo' }], goal: { name: 'Meta', target: 500, saved: 10 }, lessons: [] } } };
  const decoded = decodeSnapshot(JSON.stringify(old));
  assert.equal(decoded.source, 'web');
  assert.equal(decoded.state.datasets.business.currency, 'EUR');
  assert.equal(decoded.state.datasets.business.rows[0].financialType, 'cogs');
  assert.equal(decoded.state.datasets.business.rows[0].behavior, 'variable');
  const web = toWebState(decoded.state);
  assert.equal(web.month, '2026-09');
  assert.equal(web.theme, 'dark');
  assert.equal(web.previewCurrency, 'CAD');
});

test('scope binding prevents accidental imports across accounts or into local storage', () => {
  const raw = encodeSnapshot(state(), { source: 'web', scope: 'google:one' });
  assert.throws(() => decodeSnapshot(raw, { scope: 'google:two' }), /cuenta|espacio/i);
  assert.throws(() => decodeSnapshot(raw, { scope: 'local' }), /cuenta|espacio/i);
  assert.equal(scopeFromStorageKey('finflow-open-v1:google:one'), 'google:one');
  assert.equal(scopeFromStorageKey('finflow-mobile-v1:google:one'), 'google:one');
  assert.equal(scopeFromStorageKey('finflow-open-v1'), 'local');
});

test('rejects malformed versions, arrays, duplicate IDs and invalid financial values before restoring', () => {
  const invalid = [
    { ...state(), datasets: [] },
    { ...state(), datasets: { personal: { ...workspace(), currency: 'XXX' } } },
    { ...state(), datasets: { personal: { ...workspace(), rows: [...workspace().rows, ...workspace().rows] } } },
    { ...state(), datasets: { personal: { ...workspace(), budgets: { Test: -1 } } } },
    { ...state(), datasets: { personal: { ...workspace(), finance: { '2026-02': { opening: 0, savingsTarget: 101, expenseBudget: 0, unitPrice: 0 } } } } },
    { ...state(), datasets: { personal: { ...workspace(), rows: [{ ...workspace().rows[0], date: '2026-02-31' }] } } },
    { ...state(), datasets: { personal: { ...workspace(), lastMonth: '__proto__' } } },
    { ...state(), scenario: { monthly: '<script>', years: 5, rate: 3, fee: 0.5, inflation: 2 } },
    { ...state(), datasets: { personal: { ...workspace(), rows: [{ ...workspace().rows[0], financialType: 0 }] } } },
  ];
  for (const value of invalid) assert.throws(() => encodeSnapshot(value));
  const changedVersion = JSON.parse(encodeSnapshot(state())); changedVersion.schemaVersion = 999;
  assert.throws(() => decodeSnapshot(JSON.stringify(changedVersion)), /versión|formato/i);
  assert.throws(() => decodeSnapshot('{bad json'));
  assert.throws(() => decodeSnapshot('{"format":"finflow-mobile-v1","state":[]}'));
});

test('rejects prototype keys and nonfinite extension values without silently dropping data', () => {
  const malicious = JSON.parse('{"month":"2026-10","datasets":{},"__proto__":{"polluted":true}}');
  assert.throws(() => decodeSnapshot(JSON.stringify(malicious)));
  assert.equal({}.polluted, undefined);
  assert.throws(() => encodeSnapshot({ ...state(), futureValue: Infinity }));
});

test('preserves precision and all supported currencies in portable backups', async () => {
  const { CURRENCIES } = await import('../src/workspace/currencies.mjs');
  for (const { code } of CURRENCIES) {
    const value = { ...state(), datasets: { personal: { ...workspace(code), rows: [{ ...workspace().rows[0], amount: 1.2345 }] } } };
    const restored = decodeSnapshot(encodeSnapshot(value)).state;
    assert.equal(restored.datasets.personal.currency, code);
    assert.equal(restored.datasets.personal.rows[0].amount, 1.2345);
  }
});

test('enforces the backup size by UTF-8 bytes rather than only JavaScript string length', () => {
  assert.throws(() => encodeSnapshot({ ...state(), extra: 'ñ'.repeat(2200000) }), /4 MB|tamaño|límite/i);
  assert.throws(() => decodeSnapshot('x'.repeat(4 * 1024 * 1024 + 1)), /4 MB|tamaño|límite/i);
});
