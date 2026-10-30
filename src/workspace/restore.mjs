import { encodeSnapshot, scopeFromStorageKey } from './snapshot.mjs';

// The adapter's individual write must be atomic (SQLite or localStorage).
// IndexedDB can commit both records together using its own transaction.
export async function restoreSnapshot(storage, key, previous, incoming, { source = 'web' } = {}) {
  const scope = scopeFromStorageKey(key);
  const next = encodeSnapshot(incoming, { source, scope });
  const recovery = encodeSnapshot(previous, { source, scope });
  await storage.write(recovery, key + ':before-restore');
  await storage.write(next, key);
  return next;
}
