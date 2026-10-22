// Cuenta y nube con Firebase, por sus APIs REST (sin SDK ni dependencias): Authentication (correo y
// contraseña), Firestore (trabajos, papel, ajustes) y Storage (los PDF). Todo vive en users/{uid}/…
// IndexedDB sigue siendo la copia de trabajo: cada cambio entra a la cola `outbox` y se sube en segundo plano.
(function (root) {
  // ---------- valores de Firestore ----------
  function toValue(v) {
    if (v === null || v === undefined) return { nullValue: null };
    if (typeof v === 'boolean') return { booleanValue: v };
    if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    if (typeof v === 'string') return { stringValue: v };
    if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } };
    // Las claves que empiezan con _ son cachés locales (p. ej. el texto plano para buscar).
    return { mapValue: { fields: Object.fromEntries(Object.entries(v).filter(([k, x]) => x !== undefined && !k.startsWith('_')).map(([k, x]) => [k, toValue(x)])) } };
  }

  function fromValue(v) {
    if ('stringValue' in v) return v.stringValue;
    if ('integerValue' in v) return Number(v.integerValue);
    if ('doubleValue' in v) return v.doubleValue;
    if ('booleanValue' in v) return v.booleanValue;
    if ('arrayValue' in v) return (v.arrayValue.values || []).map(fromValue);
    if ('mapValue' in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, fromValue(x)]));
    return null;
  }

  if (typeof module !== 'undefined' && module.exports) { module.exports = { toValue, fromValue }; return; }

  const C = typeof FIREBASE_CONFIG !== 'undefined' ? FIREBASE_CONFIG : {};
  const enabled = !!(C.apiKey && C.projectId);
  const SESSION = 'pss-session';
  let session = null; // { uid, email, refreshToken, idToken, exp }
  const status = { pending: 0, error: '', busy: false };

  // ---------- cuenta ----------
  const MESSAGES = {
    EMAIL_EXISTS: 'Ya existe una cuenta con ese correo. Use «Entrar».',
    EMAIL_NOT_FOUND: 'Correo o contraseña incorrectos.',
    INVALID_PASSWORD: 'Correo o contraseña incorrectos.',
    INVALID_LOGIN_CREDENTIALS: 'Correo o contraseña incorrectos.',
    INVALID_EMAIL: 'El correo no es válido.',
    MISSING_PASSWORD: 'Escriba la contraseña.',
    WEAK_PASSWORD: 'La contraseña debe tener al menos 6 caracteres.',
    TOO_MANY_ATTEMPTS_TRY_LATER: 'Demasiados intentos: espere unos minutos.',
    USER_DISABLED: 'Esta cuenta está desactivada.',
    OPERATION_NOT_ALLOWED: 'En Firebase falta activar el acceso con correo y contraseña.',
    TOKEN_EXPIRED: 'Su sesión venció: cierre sesión y vuelva a entrar.',
    INVALID_REFRESH_TOKEN: 'Su sesión venció: cierre sesión y vuelva a entrar.',
    USER_NOT_FOUND: 'La cuenta ya no existe.',
  };
  const fail = (code) => Object.assign(new Error(MESSAGES[String(code).split(' ')[0]] || `Error de la cuenta (${code}).`), { code });

  async function post(url, body, form) {
    let r;
    try {
      r = await fetch(url, form
        ? { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(body) }
        : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } catch { throw Object.assign(new Error('Sin conexión con Firebase. Revise su internet.'), { offline: true }); }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw fail(j.error?.message || r.status);
    return j;
  }
  const accounts = (m) => `https://identitytoolkit.googleapis.com/v1/accounts:${m}?key=${C.apiKey}`;

  function keep(uid, email, refreshToken, idToken, expiresIn) {
    session = { uid, email, refreshToken, idToken, exp: Date.now() + Number(expiresIn || 3600) * 1000 };
    try { localStorage.setItem(SESSION, JSON.stringify({ uid, email, refreshToken })); } catch {}
  }

  async function signIn(email, password, create) {
    const j = await post(accounts(create ? 'signUp' : 'signInWithPassword'), { email, password, returnSecureToken: true });
    keep(j.localId, j.email, j.refreshToken, j.idToken, j.expiresIn);
    return session;
  }

  const resetPassword = (email) => post(accounts('sendOobCode'), { requestType: 'PASSWORD_RESET', email });

  // Token vigente (dura una hora; se renueva con el refreshToken).
  async function token() {
    if (session.idToken && Date.now() < session.exp - 60000) return session.idToken;
    const j = await post(`https://securetoken.googleapis.com/v1/token?key=${C.apiKey}`, { grant_type: 'refresh_token', refresh_token: session.refreshToken }, true);
    keep(j.user_id, session.email, j.refresh_token, j.id_token, j.expires_in);
    return session.idToken;
  }

  function saved() {
    try { return JSON.parse(localStorage.getItem(SESSION)); } catch { return null; }
  }

  function signOut() {
    session = null;
    try { localStorage.removeItem(SESSION); } catch {}
  }

  // ---------- Firestore y Storage ----------
  const docs = () => `https://firestore.googleapis.com/v1/projects/${C.projectId}/databases/(default)/documents/users/${session.uid}`;
  const object = (id) => `https://firebasestorage.googleapis.com/v0/b/${C.storageBucket}/o/${encodeURIComponent(`users/${session.uid}/files/${id}.pdf`)}`;

  async function req(url, opts = {}, scheme = 'Bearer') {
    let r;
    try { r = await fetch(url, { ...opts, headers: { Authorization: `${scheme} ${await token()}`, ...opts.headers } }); } catch (err) {
      if (err.code) throw err;
      throw Object.assign(new Error('Sin conexión con Firebase.'), { offline: true });
    }
    if (r.ok || (opts.method === 'DELETE' && r.status === 404)) return r;
    const j = await r.json().catch(() => ({}));
    throw Object.assign(new Error(j.error?.message || `Firebase respondió ${r.status}`), { status: r.status });
  }

  async function list(store) {
    const out = [];
    let page = '';
    do {
      const j = await (await req(`${docs()}/${store}?pageSize=300${page ? '&pageToken=' + page : ''}`)).json();
      for (const d of j.documents || []) out.push(fromValue({ mapValue: { fields: d.fields || {} } }));
      page = j.nextPageToken || '';
    } while (page);
    return out;
  }

  const putDoc = (store, value) => req(`${docs()}/${store}/${encodeURIComponent(value.id)}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: toValue(value).mapValue.fields }),
  });
  const delDoc = (store, id) => req(`${docs()}/${store}/${encodeURIComponent(id)}`, { method: 'DELETE' });

  const upload = (id, blob) => req(`https://firebasestorage.googleapis.com/v0/b/${C.storageBucket}/o?name=${encodeURIComponent(`users/${session.uid}/files/${id}.pdf`)}`,
    { method: 'POST', headers: { 'Content-Type': 'application/pdf' }, body: blob }, 'Firebase');
  const fileBlob = async (id) => new Blob([await (await req(object(id) + '?alt=media', {}, 'Firebase')).blob()], { type: 'application/pdf' });

  // ---------- sincronización ----------
  const SYNCED = ['settings', 'papers', 'works', 'files'];
  let flushing = null, again = false, timer = 0;

  async function queue(store, ids, op) {
    if (!session || !SYNCED.includes(store)) return;
    const at = Date.now();
    await DB.putMany('outbox', ids.map((id) => ({ id: `${store}/${id}`, store, doc: id, op, at })), true);
    clearTimeout(timer);
    timer = setTimeout(flush, 1500);
  }

  // Sube la cola en orden. Un documento que Firebase rechaza (p. ej. por tamaño) no detiene a los demás.
  async function flush() {
    if (!session) return;
    if (flushing) { again = true; return flushing; }
    flushing = (async () => {
      status.busy = true;
      status.error = '';
      try {
        for (const o of await DB.all('outbox')) {
          try {
            if (o.op === 'del') {
              await delDoc(o.store, o.doc);
              if (o.store === 'files') await req(object(o.doc), { method: 'DELETE' }, 'Firebase');
            } else {
              const v = await DB.get(o.store, o.doc);
              if (v && o.store === 'files') {
                if (v.blob) await upload(v.id, v.blob);
                await putDoc('files', { id: v.id, name: v.name, addedAt: v.addedAt });
              } else if (v) await putDoc(o.store, v);
            }
            if ((await DB.get('outbox', o.id))?.at === o.at) await DB.del('outbox', o.id, true); // si cambió mientras subía, queda
          } catch (err) {
            status.error = err.message;
            if (err.offline || !err.status || err.status === 401 || err.status === 403 || err.status >= 500) break;
          }
        }
      } finally {
        status.pending = (await DB.all('outbox')).length;
        status.busy = false;
        flushing = null;
        root.dispatchEvent(new Event('cloud-status'));
        if (again) { again = false; flush(); }
      }
    })();
    return flushing;
  }

  // Trae la cuenta a la copia local. Lo que espera en la cola gana; lo que no está en la nube ni en la cola se
  // borró en otra computadora. De los PDF solo se trae la ficha: el archivo se baja al abrirlo.
  async function pull() {
    const pending = new Set((await DB.all('outbox')).map((o) => o.id));
    for (const store of SYNCED) {
      const remote = await list(store);
      const ids = new Set(remote.map((r) => r.id));
      const local = await DB.all(store);
      const byId = new Map(local.map((l) => [l.id, l]));
      const fresh = remote.filter((r) => !pending.has(`${store}/${r.id}`))
        .map((r) => (store === 'files' ? { ...r, blob: byId.get(r.id)?.blob || null } : r));
      await DB.putMany(store, fresh, true);
      for (const l of local) if (!ids.has(l.id) && !pending.has(`${store}/${l.id}`)) await DB.del(store, l.id, true);
    }
  }

  // Al volver la conexión o cada minuto, se reintenta lo pendiente.
  root.addEventListener('online', () => flush());
  setInterval(() => { if (session && status.pending) flush(); }, 60000);

  root.Cloud = {
    enabled, status, signIn, signOut, resetPassword, fileBlob, flush, pull,
    user: () => session,
    // Sesión guardada en este navegador (sin validarla: el token se renueva en la primera petición).
    resume() { const s = saved(); if (s?.refreshToken) session = { ...s, idToken: '', exp: 0 }; return session; },
    start() { DB.onChange = queue; return DB.all('outbox').then((o) => { status.pending = o.length; if (o.length) flush(); }); },
  };
})(this);
