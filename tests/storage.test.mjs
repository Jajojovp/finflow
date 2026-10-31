import test from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory, IDBDatabase } from 'fake-indexeddb';
import { openWorkspaceStorage } from '../src/workspace/storage.mjs';
import { decodeSnapshot } from '../src/workspace/snapshot.mjs';
const base = () => ({ profile: 'personal', entity: 0, period: '2026-10', datasets: {} });
const local = entries => { const values = new Map(entries); return { getItem: key => values.get(key) ?? null, values }; };
const setup = () => ({ indexedDB: new IDBFactory(), legacyStorage: local(), key: 'finflow-open-v1', initialState: base() });

test('migrates legacy data once and keeps the exact original source untouched', async () => {
  const options = setup(), old = JSON.stringify({ month: '2026-10', entity: 0, datasets: {}, extra: 'original' });
  options.legacyStorage.values.set(options.key, old);
  const first = await openWorkspaceStorage(options);
  assert.equal(first.read().extra, 'original');
  await first.save({ ...first.read(), extra: 'new' }); first.close();
  const second = await openWorkspaceStorage(options);
  assert.equal(second.read().extra, 'new');
  assert.equal(options.legacyStorage.getItem(options.key), old);
  second.close();
});
test('an invalid migration never replaces or removes the source', async () => {
  const options = setup(); options.legacyStorage.values.set(options.key, '{bad');
  await assert.rejects(openWorkspaceStorage(options));
  assert.equal(options.legacyStorage.getItem(options.key), '{bad');
  options.legacyStorage.values.set(options.key, JSON.stringify({ month: '2026-10', datasets: {}, extra: 'repaired' }));
  const store = await openWorkspaceStorage(options);
  assert.equal(store.read().extra, 'repaired'); store.close();
});
test('a stale tab cannot overwrite a newer transaction', async () => {
  const options = setup(), one = await openWorkspaceStorage(options), two = await openWorkspaceStorage(options);
  await one.save({ ...one.read(), extra: 'latest' });
  await assert.rejects(two.save({ ...two.read(), extra: 'stale' }), /pestaña|recarga/i);
  const three = await openWorkspaceStorage(options);
  assert.equal(three.read().extra, 'latest');
  one.close(); two.close(); three.close();
});
test('queues writes from the same tab and keeps account scopes separate', async () => {
  const options = setup(), store = await openWorkspaceStorage(options);
  await Promise.all([store.save({ ...base(), extra: 1 }), store.save({ ...base(), extra: 2 })]);
  assert.equal(store.read().extra, 2);
  const other = await openWorkspaceStorage({ ...options, key: options.key + ':google:one' });
  assert.equal(other.read().extra, undefined);
  store.close(); other.close();
});
test('recovery and replacement commit together, and invalid writes preserve both', async () => {
  const options = setup(), store = await openWorkspaceStorage(options);
  await store.save({ ...base(), extra: 'old' });
  await store.save({ ...base(), extra: 'new' }, { recovery: true });
  assert.equal(decodeSnapshot(await store.readRecovery()).state.extra, 'old');
  await assert.rejects(store.save({ ...base(), entity: -1 }, { recovery: true }));
  assert.equal(store.read().extra, 'new');
  assert.equal(decodeSnapshot(await store.readRecovery()).state.extra, 'old');
  store.close();
});
test('an aborted transaction never publishes its put or its recovery copy', async () => {
  const options = setup(), store = await openWorkspaceStorage(options);
  await store.save({ ...base(), extra: 'before' });
  const realTransaction = IDBDatabase.prototype.transaction;
  IDBDatabase.prototype.transaction = function (...args) {
    const transaction = realTransaction.apply(this, args);
    if (args[1] === 'readwrite') {
      const original = transaction.objectStore.bind(transaction);
      transaction.objectStore = name => {
        const objectStore = original(name), put = objectStore.put.bind(objectStore);
        objectStore.put = (...values) => { const request = put(...values); request.addEventListener('success', () => transaction.abort()); return request; };
        return objectStore;
      };
    }
    return transaction;
  };
  try { await assert.rejects(store.save({ ...base(), extra: 'lost' }, { recovery: true })); }
  finally { IDBDatabase.prototype.transaction = realTransaction; }
  assert.equal(store.read().extra, 'before');
  assert.equal(await store.readRecovery(), null);
  const check = await openWorkspaceStorage(options);
  assert.equal(check.read().extra, 'before');
  store.close(); check.close();
});
test('opening simultaneous migrations does not replace the first committed state', async () => {
  const options = setup();
  const [one, two] = await Promise.all([openWorkspaceStorage(options), openWorkspaceStorage(options)]);
  await one.save({ ...base(), extra: 'winner' });
  await assert.rejects(two.save({ ...base(), extra: 'loser' }));
  one.close(); two.close();
});
