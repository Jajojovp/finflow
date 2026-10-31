import { decodeSnapshot, encodeSnapshot, scopeFromStorageKey, toWebState } from './snapshot.mjs';

const DATABASE = 'finflow-workspaces';
const TABLE = 'snapshots';
const clone = value => JSON.parse(JSON.stringify(value));
const message = () => new Error('No se pudo completar el guardado. Los datos anteriores se conservan.');

function connect(factory) {
  if (!factory?.open) return Promise.reject(new Error('El navegador no permite abrir el almacenamiento local. Los datos anteriores se conservan.'));
  return new Promise((resolve, reject) => {
    let stopped = false;
    const request = factory.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(TABLE);
    request.onerror = () => reject(new Error('No pudimos abrir los datos locales. Reintenta sin borrar el almacenamiento.'));
    request.onblocked = () => { stopped = true; reject(new Error('Otra pestaña bloquea la actualización. Ciérrala y reintenta.')); };
    request.onsuccess = () => { if (stopped) request.result.close(); else resolve(request.result); };
  });
}
function get(db, key) {
  return new Promise((resolve, reject) => {
    let value;
    const transaction = db.transaction(TABLE, 'readonly');
    const request = transaction.objectStore(TABLE).get(key);
    request.onsuccess = () => { value = request.result; };
    transaction.oncomplete = () => resolve(value ?? null);
    transaction.onabort = () => reject(message());
    transaction.onerror = () => {};
  });
}
function initialize(db, key, raw) {
  return new Promise((resolve, reject) => {
    let record;
    const transaction = db.transaction(TABLE, 'readwrite'), store = transaction.objectStore(TABLE);
    const request = store.get(key);
    request.onsuccess = () => {
      record = request.result;
      if (!record) { record = { revision: 1, raw }; store.put(record, key); }
    };
    transaction.oncomplete = () => resolve(record);
    transaction.onabort = () => reject(message());
    transaction.onerror = () => {};
  });
}
export async function openWorkspaceStorage({ key, legacyStorage, indexedDB = globalThis.indexedDB, initialState }) {
  const scope = scopeFromStorageKey(key), db = await connect(indexedDB);
  let closed = false, current, state, queue = Promise.resolve();
  db.onversionchange = () => { closed = true; db.close(); };
  const decode = raw => toWebState(decodeSnapshot(raw, { scope }).state);
  try {
    current = await get(db, key);
    if (!current) {
      const old = legacyStorage.getItem(key);
      const previous = old ? decode(old) : initialState;
      current = await initialize(db, key, encodeSnapshot(previous, { source: 'web', scope }));
    }
    if (!Number.isSafeInteger(current.revision) || current.revision < 1 || typeof current.raw !== 'string') throw message();
    state = decode(current.raw);
  } catch (error) { db.close(); throw error; }

  function commit(raw, recovery) {
    if (closed) throw new Error('El almacenamiento cambió. Recarga la aplicación para continuar.');
    return new Promise((resolve, reject) => {
      let next, failure;
      const transaction = db.transaction(TABLE, 'readwrite'), store = transaction.objectStore(TABLE);
      const request = store.get(key);
      request.onsuccess = () => {
        const previous = request.result;
        if (!previous || previous.revision !== current.revision) {
          failure = new Error('Los datos cambiaron en otra pestaña. Recarga antes de guardar para conservar esos cambios.');
          transaction.abort(); return;
        }
        if (!recovery && JSON.stringify(JSON.parse(previous.raw).state) === JSON.stringify(JSON.parse(raw).state)) { next = previous; return; }
        next = { revision: previous.revision + 1, raw };
        if (recovery) store.put({ raw: previous.raw }, key + ':before-restore');
        store.put(next, key);
      };
      transaction.oncomplete = () => { current = next; state = decode(next.raw); resolve(clone(state)); };
      transaction.onabort = () => reject(failure ?? message());
      transaction.onerror = () => {};
    });
  }
  return {
    read: () => clone(state),
    save(value, { recovery = false } = {}) {
      let raw;
      try { raw = encodeSnapshot(value, { source: 'web', scope }); } catch (error) { return Promise.reject(error); }
      const pending = queue.then(() => commit(raw, recovery));
      queue = pending.catch(() => {});
      return pending;
    },
    async readRecovery() {
      if (closed) throw new Error('Recarga antes de abrir la copia anterior.');
      const saved = await get(db, key + ':before-restore');
      const raw = saved?.raw ?? legacyStorage.getItem(key + ':before-restore');
      if (raw) decode(raw);
      return raw ?? null;
    },
    close() { closed = true; db.close(); },
  };
}
