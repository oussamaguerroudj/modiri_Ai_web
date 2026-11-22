// Tiny promise wrapper around IndexedDB (no dependencies).
// Stores: cache (last good GET responses), outbox (pending writes), meta (id map, misc).
const DB_NAME = 'modiri-sync';
const DB_VERSION = 1;
let dbPromise = null;

function open() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB unavailable'));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      db.createObjectStore('cache', { keyPath: 'key' });
      db.createObjectStore('outbox', { keyPath: 'id' });
      db.createObjectStore('meta', { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

const wrap = (r) =>
  new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });

async function run(store, mode, fn) {
  const db = await open();
  return wrap(fn(db.transaction(store, mode).objectStore(store)));
}

export const idb = {
  get: (s, k) => run(s, 'readonly', (o) => o.get(k)),
  put: (s, v) => run(s, 'readwrite', (o) => o.put(v)),
  del: (s, k) => run(s, 'readwrite', (o) => o.delete(k)),
  all: (s) => run(s, 'readonly', (o) => o.getAll()),
  clear: (s) => run(s, 'readwrite', (o) => o.clear()),
};
