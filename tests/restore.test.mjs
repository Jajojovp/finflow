import test from 'node:test';
import assert from 'node:assert/strict';
import { restoreSnapshot } from '../src/workspace/restore.mjs';
import { encodeSnapshot, decodeSnapshot } from '../src/workspace/snapshot.mjs';
const state = name => ({ version: 1, profile: 'personal', entity: 0, period: '2026-10', datasets: {}, extra: name });
test('saves a recoverable copy before replacing the complete snapshot', async () => {
  const values = new Map(), key = 'finflow-mobile-v1:google:one';
  const storage = { write: async (value, name) => values.set(name, value) };
  await restoreSnapshot(storage, key, state('before'), state('after'), { source: 'mobile' });
  assert.equal(decodeSnapshot(values.get(key), { scope: 'google:one' }).state.extra, 'after');
  assert.equal(decodeSnapshot(values.get(key + ':before-restore'), { scope: 'google:one' }).state.extra, 'before');
});
test('a failed final write leaves the original saved state available', async () => {
  const key = 'finflow-open-v1', original = encodeSnapshot(state('original'));
  const values = new Map([[key, original]]);
  const storage = { write: async (value, name) => { if (name === key) throw new Error('quota'); values.set(name, value); } };
  await assert.rejects(restoreSnapshot(storage, key, state('original'), state('new')), /quota/);
  assert.equal(values.get(key), original);
  assert.equal(decodeSnapshot(values.get(key + ':before-restore')).state.extra, 'original');
});
test('a failed recovery write never attempts to replace the current data', async () => {
  let writes = 0;
  const storage = { write: async () => { writes++; throw new Error('recovery unavailable'); } };
  await assert.rejects(restoreSnapshot(storage, 'finflow-open-v1', state('old'), state('new')));
  assert.equal(writes, 1);
});
test('invalid incoming state is rejected before any write', async () => {
  let writes = 0;
  const storage = { write: async () => { writes++; } };
  await assert.rejects(restoreSnapshot(storage, 'finflow-open-v1', state('old'), { ...state('new'), datasets: [] }));
  assert.equal(writes, 0);
});
