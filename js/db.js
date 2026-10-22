// Almacenamiento local en IndexedDB: los documentos nunca salen del navegador.
// files: PDF originales · papers: hojas de papel sellado · works: trabajos · settings: preferencias.
const DB = (() => {
  const STORES = ['files', 'papers', 'works', 'settings'];
  let dbPromise;

  function open() {
    dbPromise = dbPromise || new Promise((resolve, reject) => {
      const req = indexedDB.open('papel-sellado-suite', 1);
      req.onupgradeneeded = () => {
        for (const name of STORES) if (!req.result.objectStoreNames.contains(name)) req.result.createObjectStore(name, { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  async function tx(store, mode, fn) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const t = db.transaction(store, mode);
      const result = fn(t.objectStore(store));
      t.oncomplete = () => resolve(result && 'result' in result ? result.result : result);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error || new Error('Transacción cancelada'));
    });
  }

  return {
    all: (store) => tx(store, 'readonly', (s) => s.getAll()),
    get: (store, id) => tx(store, 'readonly', (s) => s.get(id)),
    put: (store, value) => tx(store, 'readwrite', (s) => { s.put(value); }),
    putMany: (store, values) => tx(store, 'readwrite', (s) => { values.forEach((v) => s.put(v)); }),
    del: (store, id) => tx(store, 'readwrite', (s) => { s.delete(id); }),
    STORES,
  };
})();

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
