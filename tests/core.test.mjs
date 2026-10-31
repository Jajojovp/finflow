import test from 'node:test';
import assert from 'node:assert/strict';
import { totals, parseCSV, scenario, validateTransaction, csvExport } from '../src/workspace/core.mjs';
test('balances are computed in cents and undefined saving rate stays null', () => {
  assert.deepEqual(totals([{type:'ingreso',amount:0.3},{type:'gasto',amount:0.1}]), {income:0.3,expense:0.1,net:0.2,rate:0.2/0.3*100});
  assert.equal(totals([]).rate, null);
});
test('CSV imports quoted descriptions, escaped quotes and semicolon decimals', () => {
  assert.equal(parseCSV('fecha,descripcion,categoria,tipo,importe\n2026-10-01,"Compra, tienda",Otros,gasto,10.50')[0].description, 'Compra, tienda');
  assert.equal(parseCSV('fecha;descripcion;categoria;tipo;importe\n2026-10-01;"Un ""texto""";Otros;gasto;10,50')[0].amount, 10.5);
});
test('CSV rejects a bad row atomically and calendar-invalid dates', () => {
  assert.throws(() => parseCSV('fecha,descripcion,categoria,tipo,importe\n2026-10-01,Sueldo,Trabajo,ingreso,3000\n2026-10-02,X,Otros,gasto,-8'), /Fila 3/);
  assert.throws(() => validateTransaction({date:'2026-02-30',description:'X',type:'gasto',amount:20}), /fecha/);
});
test('hypothetical scenarios expose contributions and growth', () => {
  assert.deepEqual(scenario(100,12,0), {balance:1200,contributions:1200,growth:0});
  assert.ok(scenario(100,12,5).balance > 1200);
});
test('CSV export neutralizes spreadsheet formulas in descriptions', () => {
  assert.ok(csvExport([{date:'2026-10-01',description:'=HYPERLINK("x")',category:'Otros',type:'gasto',amount:1}]).includes('"\'=HYPERLINK'));
});
