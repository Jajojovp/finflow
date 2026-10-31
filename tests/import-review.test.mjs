import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewImport, applyImport } from '../src/workspace/import-review.mjs';
const header = 'fecha,descripcion,categoria,tipo,importe\n';
const csv = header + '2026-10-01,"Café, Ñuñoa",Ocio,gasto,10.1234\n2026-10-01,"Café, Ñuñoa",Ocio,gasto,10.1234\n2026-11-01,Sueldo,Trabajo,ingreso,100';
const space = () => ({ currency: 'CLP', rows: [], trash: [] });
test('review is read-only, preserves precision and detects within-file duplicates', () => {
  const d = space(), before = JSON.stringify(d), r = reviewImport(csv, d);
  assert.equal(JSON.stringify(d), before);
  assert.equal(r.total, 3); assert.equal(r.duplicates, 1); assert.equal(r.rows.length, 2);
  assert.equal(r.rows[0].amount, 10.1234); assert.equal(r.latestMonth, '2026-11');
  assert.equal(r.ok, true);
});
test('every invalid row is reported and no valid subset can be committed', () => {
  const d = space(), r = reviewImport(header + '2026-02-30,X,Ocio,gasto,5\n2026-10-01,X,Ocio,gasto,-1\n2026-10-01,Valido,Ocio,gasto,3', d);
  assert.equal(r.ok, false); assert.deepEqual(r.errors.map(e => e.row), [2, 3]);
  assert.throws(() => applyImport(r, d), /corrige|Corrige/); assert.equal(d.rows.length, 0);
});
test('confirmation rechecks destination and repeated confirmation cannot duplicate', () => {
  const d = space(), r = reviewImport(csv, d);
  const first = applyImport(r, d, i => 'row-' + i);
  assert.equal(first.rows.length, 2); assert.equal(applyImport(r, first).rows.length, 2);
  assert.throws(() => applyImport(r, { ...d, currency: 'USD' }), /moneda/);
  const afterArchive = { ...d, trash: [{ ...first.rows[0] }] };
  const restored = applyImport(r, afterArchive, i => 'row-' + i);
  assert.notEqual(restored.rows[0].id, afterArchive.trash[0].id);
});
test('quotes, Unicode, newlines and decimal commas use the existing parser', () => {
  const r = reviewImport('fecha;descripcion;categoria;tipo;importe\n2026-10-01;"Café\ncon ""leche""";Ocio;gasto;10,5', space());
  assert.equal(r.rows[0].description, 'Café\ncon "leche"'); assert.equal(r.rows[0].amount, 10.5);
  assert.equal(reviewImport(header + '"sin cerrar', space()).ok, false);
});
test('UTF-8 byte limits and destination capacity block the entire batch', () => {
  assert.equal(reviewImport(header + 'ñ'.repeat(1100000), space()).ok, false);
  const d = { ...space(), rows: Array.from({ length: 5000 }, (_, i) => ({date:'2026-01-01', description:'Existing ' + i, category:'Otros', type:'gasto', amount:1})) };
  assert.equal(reviewImport(csv, d).ok, false);
  assert.throws(() => applyImport(reviewImport(csv, space()), d), /5.000/);
});
