import test from 'node:test';
import assert from 'node:assert/strict';
import { CURRENCIES, currencyOptions, currencyDigits, formatMoney, isCurrencyCode, searchCurrencies, changeCurrency } from '../src/workspace/currencies.mjs';
import { validateTransaction, parseCSV, csvExport } from '../src/workspace/core.mjs';
import { cashPosition, incomeStatement } from '../src/workspace/finance.mjs';

test('the shared catalog includes requested pesos and dollars and ISO currencies beyond the original four', () => {
  assert.ok(CURRENCIES.length > 150);
  for (const code of ['CLP', 'ARS', 'USD', 'CAD', 'EUR', 'JPY', 'KWD', 'CLF']) assert.ok(isCurrencyCode(code), code);
  assert.equal(isCurrencyCode('ZZZ'), false);
  assert.equal(isCurrencyCode('<script>'), false);
  assert.equal(new Set(CURRENCIES.map(c => c.code)).size, CURRENCIES.length);
  assert.deepEqual(currencyOptions.slice(0, 4).map(c => c.code), ['CLP', 'ARS', 'USD', 'CAD']);
  assert.ok(searchCurrencies('peso chileno').some(c => c.code === 'CLP'));
  assert.ok(searchCurrencies('dolar canadiense').some(c => c.code === 'CAD'));
});

test('formatting identifies the currency and uses its ISO decimal precision', () => {
  for (const code of ['CLP', 'ARS', 'USD', 'CAD']) assert.match(formatMoney(1234.5, code), new RegExp(code));
  assert.equal(currencyDigits('CLP'), 0);
  assert.equal(currencyDigits('JPY'), 0);
  assert.equal(currencyDigits('KWD'), 3);
  assert.equal(currencyDigits('CLF'), 4);
  assert.match(formatMoney(1.234, 'KWD'), /1,234/);
  assert.match(formatMoney(1.2345, 'CLF'), /1,2345/);
  assert.equal(formatMoney(-0, 'CLP'), formatMoney(0, 'CLP'));
  assert.equal(formatMoney(NaN, 'USD'), '—');
});

test('transactions, CSV and cash/results preserve three and four currency decimals', () => {
  const row = validateTransaction({ date: '2026-10-30', description: 'Ingreso', category: 'Trabajo', type: 'ingreso', amount: 1.2345, financialType: 'revenue' });
  assert.equal(row.amount, 1.2345);
  assert.equal(parseCSV(csvExport([row]))[0].amount, 1.2345);
  assert.equal(cashPosition([row], 0, 'CLF').available, 1.2345);
  assert.equal(incomeStatement([row], 'CLF').revenue, 1.2345);
  const kwd = { ...row, amount: 1.234 };
  assert.equal(cashPosition([kwd, { ...kwd, type: 'gasto', amount: 0.001 }], 0, 'KWD').net, 1.233);
});

test('switching currency preserves amounts and does not mutate another client', () => {
  const original = { currency: 'EUR', rows: [{ amount: 12.34 }], goal: { target: 800 }, finance: { opening: 123 } };
  const selected = changeCurrency(original, 'ARS');
  assert.equal(original.currency, 'EUR');
  assert.equal(selected.currency, 'ARS');
  assert.equal(selected.rows, original.rows);
  assert.equal(selected.goal, original.goal);
  assert.equal(selected.finance, original.finance);
  assert.throws(() => changeCurrency(original, 'INVALID'));
  assert.equal(JSON.parse(JSON.stringify(selected)).currency, 'ARS');
});
