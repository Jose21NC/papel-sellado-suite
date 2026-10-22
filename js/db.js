// Almacenamiento local en IndexedDB, una base por cuenta (la de antes de las cuentas no lleva sufijo).
// files: PDF originales · papers: hojas de papel sellado · works: trabajos · settings: preferencias.
// outbox: cambios por subir a la nube (js/cloud.js). Cada cambio que no sea `local` se avisa a onChange.
const DB = (() => {
  const STORES = ['files', 'papers', 'works', 'settings', 'outbox'];
  const BASE = 'papel-sellado-suite';
  let name = BASE, dbPromise;

  function openDb(dbName) {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(dbName, 2);
      req.onupgradeneeded = () => {
        for (const s of STORES) if (!req.result.objectStoreNames.contains(s)) req.result.createObjectStore(s, { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  const open = () => (dbPromise = dbPromise || openDb(name));

  async function tx(store, mode, fn, db) {
    db = db || await open();
    return new Promise((resolve, reject) => {
      const t = db.transaction(store, mode);
      const result = fn(t.objectStore(store));
      t.oncomplete = () => resolve(result && 'result' in result ? result.result : result);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error || new Error('Transacción cancelada'));
    });
  }

  const api = {
    onChange: null,
    // Pasa a la base de la cuenta `uid`.
    use(uid) { name = uid ? `${BASE}-${uid}` : BASE; dbPromise = null; },
    all: (store) => tx(store, 'readonly', (s) => s.getAll()),
    get: (store, id) => tx(store, 'readonly', (s) => s.get(id)),
    put: (store, value, local) => api.putMany(store, [value], local),
    async putMany(store, values, local) {
      await tx(store, 'readwrite', (s) => { values.forEach((v) => s.put(v)); });
      if (!local && values.length) api.onChange?.(store, values.map((v) => v.id), 'put');
    },
    async del(store, id, local) {
      await tx(store, 'readwrite', (s) => { s.delete(id); });
      if (!local) api.onChange?.(store, [id], 'del');
    },
    // Todo lo guardado en la base sin cuenta (para subirlo a la cuenta la primera vez).
    async legacy() {
      if (indexedDB.databases && !(await indexedDB.databases()).some((d) => d.name === BASE)) return null;
      const db = await openDb(BASE);
      const out = {};
      for (const s of ['files', 'papers', 'works', 'settings']) out[s] = await tx(s, 'readonly', (st) => st.getAll(), db);
      db.close();
      return out;
    },
    // Borra la copia local de la cuenta (al cerrar sesión).
    async drop() {
      (await dbPromise)?.close();
      dbPromise = null;
      await new Promise((r) => { const q = indexedDB.deleteDatabase(name); q.onsuccess = q.onerror = q.onblocked = r; });
    },
    STORES,
  };
  return api;
})();

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
