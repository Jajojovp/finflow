import test from 'node:test';
import assert from 'node:assert/strict';
import { listClients, createClient, setClientArchived } from '../src/workspace/clients.mjs';
import { encodeSnapshot, decodeSnapshot } from '../src/workspace/snapshot.mjs';
const state = () => ({profile:'advisor', entity:0, period:'2026-10', datasets:{}});
test('fourth client is empty, named, and uses the selected currency without modifying the old three', () => {
  const s = state(), next = createClient(s, {name:'  Cliente de Chile  ', currency:'CLP'});
  assert.equal(next.entity, 3); assert.equal(next.datasets['advisor-3'].name, 'Cliente de Chile');
  assert.equal(next.datasets['advisor-3'].currency, 'CLP'); assert.deepEqual(next.datasets['advisor-3'].rows, []);
  assert.deepEqual(s, state()); assert.equal(listClients(next).length, 4);
  assert.equal(listClients(next)[0].key, 'advisor-0');
});
test('archive and restore preserve IDs, money, settings and backup compatibility', () => {
  const s = createClient(state(), {name:'Cliente CAD', currency:'CAD'});
  const d = s.datasets['advisor-3']; d.finance['2026-10'].opening = 125; d.analysis.extra = 'keep';
  const archived = setClientArchived(s, 3, true);
  assert.equal(archived.entity, 0); assert.equal(listClients(archived).find(c => c.index === 3).archived, true);
  const decoded = decodeSnapshot(encodeSnapshot(archived)).state;
  const restored = setClientArchived(decoded, 3, false);
  assert.deepEqual(restored.datasets['advisor-3'], {...d, archived:false});
});
test('archived IDs are never reused and active datasets stay separate', () => {
  const s = setClientArchived(createClient(state(), {name:'Tres', currency:'ARS'}), 3, true);
  const next = createClient(s, {name:'Cuatro', currency:'USD'});
  assert.equal(next.entity, 4); assert.equal(next.datasets['advisor-3'].currency, 'ARS');
  assert.equal(next.datasets['advisor-4'].currency, 'USD');
});
test('reject invalid names, currency and capacity without changing input', () => {
  assert.throws(() => createClient(state(), {name:' ',currency:'CLP'}), /nombre/);
  assert.throws(() => createClient(state(), {name:'X',currency:'BAD'}), /moneda/);
  assert.throws(() => createClient({...state(),entity:99}, {name:'X',currency:'CLP'}), /100/);
  assert.throws(() => createClient({...state(),profile:'personal'}, {name:'X',currency:'CLP'}), /profesional/);
});
test('last active client is retained and legacy virtual clients can be archived reversibly', () => {
  const s = setClientArchived(setClientArchived(state(), 0, true), 1, true);
  assert.throws(() => setClientArchived(s, 2, true), /activo/);
  assert.equal(setClientArchived(s, 0, false).datasets['advisor-0'].archived, false);
});
