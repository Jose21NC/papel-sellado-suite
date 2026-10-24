// Interfaz: inventario de papel sellado, trabajos (histórico), editor e impresión.
(() => {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : '');
  const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString('es-NI', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
  const now = () => new Date().toISOString();

  const FONTS = [
    ['"Times New Roman", Times, serif', 'Times New Roman'],
    ['Arial, Helvetica, sans-serif', 'Arial'],
    ['"Courier New", Courier, monospace', 'Courier New'],
    ['Georgia, serif', 'Georgia'],
    ['"Book Antiqua", "Palatino Linotype", Palatino, serif', 'Book Antiqua'],
    ['Garamond, "EB Garamond", serif', 'Garamond'],
    ['"Bookman Old Style", Bookman, serif', 'Bookman'],
    ['Cambria, Georgia, serif', 'Cambria'],
    ['Calibri, Carlito, sans-serif', 'Calibri'],
  ];
  const DEFAULT_SETTINGS = { font: FONTS[0][0], size: 12, indent: 0, letterSpacing: 0, marginLeft: 0, marginRight: 0, gap: 3, dashes: true, hidePrinted: false };

  const state = { papers: [], works: [], files: new Map(), app: { id: 'app', printOffsetX: 0, printOffsetY: 0 }, work: null };

  // ---------- utilidades de interfaz ----------
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 4000);
  }

  function confirmDialog(title, text, okLabel = 'Aceptar', danger = false) {
    const d = $('#dlg-confirm');
    $('#confirm-title').textContent = title;
    $('#confirm-text').textContent = text;
    $('#confirm-ok').textContent = okLabel;
    $('#confirm-ok').className = 'btn ' + (danger ? 'danger' : 'primary');
    d.returnValue = '';
    d.showModal();
    return new Promise((r) => d.addEventListener('close', () => r(d.returnValue === 'ok'), { once: true }));
  }

  function formDialog(d, values = {}) {
    const f = d.querySelector('form');
    for (const [k, v] of Object.entries(values)) if (f.elements[k]) f.elements[k].value = v ?? '';
    d.returnValue = '';
    d.showModal();
    return new Promise((r) => d.addEventListener('close', () => {
      if (d.returnValue !== 'ok') return r(null);
      r(Object.fromEntries(new FormData(f)));
    }, { once: true }));
  }

  // ---------- datos ----------
  const paperStatus = (p) => (p.status === 'anulado' ? 'anulado' : p.workId ? 'asignado' : 'disponible');
  const paperById = (id) => state.papers.find((p) => p.id === id) || null;
  const workById = (id) => state.works.find((w) => w.id === id) || null;
  const byNumber = (a, b) => (a.serie || '').localeCompare(b.serie || '') || Number(a.numero || 0) - Number(b.numero || 0);

  async function loadAll() {
    [state.papers, state.works] = await Promise.all([DB.all('papers'), DB.all('works')]);
    state.app = (await DB.get('settings', 'app')) || state.app;
  }

  // Con cuenta, un PDF que aún no está en este navegador se baja de la nube la primera vez que se usa.
  async function fileBlob(fileId) {
    if (!state.files.has(fileId)) {
      const p = DB.get('files', fileId).then(async (f) => {
        if (!f || f.blob || !Cloud.user()) return f?.blob;
        const blob = await Cloud.fileBlob(fileId, f.chunks);
        await DB.put('files', { ...f, blob }, true);
        return blob;
      });
      p.catch(() => state.files.delete(fileId));
      state.files.set(fileId, p);
    }
    return state.files.get(fileId);
  }

  async function paperImage(paper, side, scale) {
    const blob = await fileBlob(paper.fileId);
    if (!blob) throw new Error('Falta el PDF');
    return PDF.image(paper.fileId, blob, paper.pages[side].index, scale);
  }

  // ---------- navegación ----------
  function route() {
    const [name, id] = location.hash.replace(/^#/, '').split('/');
    if (state.work && !(name === 'trabajo' && id === state.work.id)) flushSave();
    document.body.classList.toggle('editor-view', name === 'trabajo');
    $('#view-works').hidden = name !== 'trabajos' && name !== '';
    $('#view-papers').hidden = name !== 'papel';
    $('#view-perfil').hidden = name !== 'perfil';
    $('#view-editor').hidden = name !== 'trabajo';
    for (const t of document.querySelectorAll('.tab')) t.toggleAttribute('aria-current', false);
    const current = document.querySelector(`.tab[data-route="${name === 'trabajo' ? 'trabajos' : name || 'trabajos'}"]`);
    current?.setAttribute('aria-current', 'page');
    if (name === 'papel') renderPapers();
    else if (name === 'perfil') renderPerfil();
    else if (name === 'trabajo') openWork(id);
    else renderWorks();
  }
  const go = (r) => { location.hash = r; };

  function renderPerfil() {
    const u = Cloud.user(), st = Cloud.status;
    $('#cuenta-info').textContent = u ? u.email : 'Esta copia de Lexia no tiene Firebase configurado: todo se guarda solo en este navegador.';
    $('#cuenta-sync').textContent = !u ? '' : st.pending ? `${st.pending} cambio${st.pending === 1 ? '' : 's'} por subir a su cuenta.${st.error ? ' ' + st.error : ''}` : 'Todo está guardado en su cuenta.';
    $('#btn-logout').hidden = !u;
    const via = { pago: 'pago único', cupon: 'cupón', anterior: 'cuenta fundadora' }[licencia?.via];
    $('#cuenta-licencia').textContent = u && licencia?.estado === 'activa' ? `Lexia activa (${via}).` : '';
    const p = Profile.get();
    $('#perfil-resumen').textContent = p.nombre ? `${p.nombre}${p.titulo ? ' · ' + p.titulo : ''}` : 'Todavía no ha guardado sus datos.';
  }
  $('#dlg-profile').addEventListener('close', () => setTimeout(renderPerfil)); // Profile ya guardó lo nuevo
  addEventListener('cloud-status', () => { if (!$('#view-perfil').hidden) renderPerfil(); });

  // ---------- cuenta ----------
  // Pantalla de entrada: se resuelve cuando hay sesión.
  function login() {
    document.body.classList.add('auth-view');
    $('#auth').hidden = false;
    const f = $('#auth-form'), err = $('#auth-error');
    let create = false;
    const mode = () => {
      $('#auth-title').textContent = $('#auth-submit').textContent = create ? 'Crear cuenta' : 'Entrar';
      $('#auth-switch').textContent = create ? '¿Ya tiene cuenta? Entrar' : '¿No tiene cuenta? Crear una';
      $('#auth-confirm').hidden = !create;
      $('#auth-reset').hidden = create;
      f.password.autocomplete = create ? 'new-password' : 'current-password';
      err.textContent = '';
    };
    mode();
    $('#auth-switch').onclick = () => { create = !create; mode(); };
    $('#auth-reset').onclick = async () => {
      if (!f.email.value.trim()) { err.textContent = 'Escriba su correo y vuelva a pulsar «¿Olvidó su contraseña?».'; return; }
      try { await Cloud.resetPassword(f.email.value.trim()); err.textContent = ''; toast('Le enviamos un correo para cambiar la contraseña.'); } catch (e) { err.textContent = e.message; }
    };
    return new Promise((resolve) => {
      f.onsubmit = async (e) => {
        e.preventDefault();
        const email = f.email.value.trim(), password = f.password.value;
        if (!email || !password) { err.textContent = 'Escriba su correo y su contraseña.'; return; }
        if (create && password !== f.confirm.value) { err.textContent = 'Las contraseñas no coinciden.'; return; }
        $('#auth-submit').disabled = true;
        try {
          await Cloud.signIn(email, password, create);
          f.reset();
          $('#auth').hidden = true;
          document.body.classList.remove('auth-view');
          resolve();
        } catch (e2) { err.textContent = e2.message; } finally { $('#auth-submit').disabled = false; }
      };
    });
  }

  // Abre la copia local de la cuenta, sube lo pendiente y trae lo de la nube. Sin conexión sigue con lo local.
  async function openAccount() {
    DB.use(Cloud.user().uid);
    await Cloud.start();
    try {
      await Cloud.flush();
      await Cloud.pull();
    } catch (err) {
      if (err.code) { Cloud.signOut(); await login(); return openAccount(); } // la sesión ya no vale
      toast(err.offline ? 'Sin conexión con su cuenta: se muestra lo guardado en este navegador.' : `No se pudo abrir su cuenta (${err.message}). Se muestra lo guardado en este navegador.`);
      return;
    }
    // La primera vez, lo que ya había en este navegador (sin cuenta) se puede pasar a la cuenta.
    if ((await DB.all('works')).length || (await DB.all('papers')).length) return;
    const old = await DB.legacy();
    if (!old || !(old.works.length || old.papers.length)) return;
    if (!(await confirmDialog('Datos en este navegador', `Este navegador tiene ${old.works.length} trabajos y ${old.papers.length} hojas de papel sellado guardados sin cuenta. ¿Pasarlos a su cuenta?`, 'Pasarlos a mi cuenta'))) return;
    for (const s of ['files', 'papers', 'works', 'settings']) await DB.putMany(s, old[s]);
    toast('Subiendo sus datos a su cuenta…');
  }

  // ---------- muro de pago ----------
  // Un solo pago de C$ 800 por cuenta (enlace de Poket) o un cupón. El acceso es inmediato al escribir el comprobante:
  // el administrador lo revisa en Poket y, si no aparece, cambia la licencia a «desactivada» desde la consola.
  // Las cuentas creadas antes del muro no pagan.
  const CUPONES = ['BOREALABS']; // exentan del 100 %; el mismo código está en firebase/firestore.rules
  const MURO_DESDE = Date.parse('2026-10-23T01:00:00Z');
  const PRECIO = 800;
  let licencia = null; // { estado, via } para mostrarla en Perfil
  const licKey = () => `lexia-licencia-${Cloud.user().uid}`;

  async function paywall() {
    try {
      licencia = await Cloud.license() || ((await Cloud.createdAt()) < MURO_DESDE ? { estado: 'activa', via: 'anterior' } : null);
      try { localStorage.setItem(licKey(), JSON.stringify(licencia)); } catch {}
    } catch (err) {
      console.error(err);
      try { licencia = JSON.parse(localStorage.getItem(licKey())); } catch {} // sin conexión: lo último que se supo
    }
    if (licencia?.estado === 'activa') return;
    await showPaywall();
  }

  function showPaywall() {
    document.body.classList.add('auth-view');
    $('#paywall').hidden = false;
    const f = $('#pay-form'), err = $('#pay-error');
    const busy = (on) => { for (const b of f.querySelectorAll('button')) b.disabled = on; };
    $('#pay-email').textContent = `Cuenta: ${Cloud.user().email}.`;
    // Una licencia desactivada no se puede volver a crear: solo el administrador la reactiva.
    const off = !!licencia;
    for (const el of f.querySelectorAll('.price, .pay-link, label, #pay-submit, .coupon')) el.hidden = off;
    $('#pay-sub').textContent = off ? 'Su pago no se pudo verificar con Poket y Lexia quedó desactivada en esta cuenta. Si ya pagó, envíe su comprobante a soporte para reactivarla.'
      : 'Un solo pago, sin mensualidades. Lexia queda activa para siempre en su cuenta.';
    $('#pay-logout').onclick = async () => { Cloud.signOut(); await DB.drop(); location.reload(); };
    return new Promise((resolve) => {
      f.onsubmit = async (e) => {
        e.preventDefault();
        err.textContent = '';
        // Enter en el cupón también lo aplica (el botón por omisión del formulario es «Ya pagué»).
        const viaCupon = e.submitter?.value === 'cupon' || document.activeElement === f.cupon;
        let data;
        if (viaCupon) {
          const code = f.cupon.value.trim().toUpperCase();
          if (!CUPONES.includes(code)) { err.textContent = 'Ese cupón no es válido.'; return; }
          data = { via: 'cupon', cupon: code };
        } else {
          const ref = f.comprobante.value.trim();
          if (!/^[A-Za-z0-9-]{4,40}$/.test(ref)) { err.textContent = 'Escriba el número de comprobante que le dio Poket al terminar el pago.'; return; }
          data = { via: 'pago', comprobante: ref, monto: PRECIO };
        }
        busy(true);
        try {
          await Cloud.createLicense({ ...data, estado: 'activa', email: Cloud.user().email, fecha: now() });
          licencia = { estado: 'activa', via: data.via };
        } catch (e2) {
          // Ya existía (p. ej. se activó en otra computadora): vale la que está guardada.
          if (e2.status === 409) licencia = await Cloud.license().catch(() => null);
          if (licencia?.estado !== 'activa') {
            err.textContent = e2.offline ? 'Sin conexión: revise su internet e intente de nuevo.' : `No se pudo activar Lexia. Intente de nuevo en un momento. (${e2.message})`;
            busy(false);
            return;
          }
        }
        try { localStorage.setItem(licKey(), JSON.stringify(licencia)); } catch {}
        f.reset();
        busy(false);
        $('#paywall').hidden = true;
        document.body.classList.remove('auth-view');
        toast(data.via === 'cupon' ? 'Cupón aplicado: Lexia está activa en su cuenta.' : '¡Gracias! Lexia está activa en su cuenta.');
        resolve();
      };
    });
  }

  $('#btn-logout').addEventListener('click', async () => {
    await Cloud.flush();
    const n = Cloud.status.pending;
    const text = n ? `Hay ${n} cambio${n === 1 ? '' : 's'} sin subir a su cuenta que se perderán. Revise su conexión antes de salir.`
      : 'Se borra la copia de sus datos en este navegador; siguen guardados en su cuenta.';
    if (!(await confirmDialog('Cerrar sesión', text, 'Cerrar sesión', !!n))) return;
    Cloud.signOut();
    await DB.drop();
    location.reload();
  });
  document.addEventListener('click', (e) => {
    const r = e.target.closest('[data-route]');
    if (r) go(r.dataset.route);
  });

  // ---------- papel sellado ----------
  // Las subidas van en fila: dos subidas a la vez podrían agregar la misma hoja dos veces.
  let uploadQueue = Promise.resolve();
  // La lista se copia ya: el FileList del input (y el del arrastre) se vacía en cuanto se limpia el input.
  const uploadFiles = (list) => { const files = [...list]; uploadQueue = uploadQueue.then(() => doUpload(files)); return uploadQueue; };

  async function doUpload(list) {
    const files = list.filter((f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name));
    if (!files.length) { toast('Elija archivos PDF de papel sellado'); return; }
    let added = 0, dup = 0, failed = 0;
    for (const file of files) {
      toast(`Leyendo ${file.name}…`);
      const known = new Set(state.papers.map((p) => (p.serie && p.numero ? p.serie + '-' + p.numero : `${p.fileName}|${p.fileSize}|${p.pages[0]?.index}`)));
      const fileId = uid();
      let sheets;
      try { sheets = await PDF.analyze(fileId, file, file.name); } catch (err) { console.error(err); failed++; PDF.forget(fileId); continue; }
      // Sin serie ni número (PDF no reconocido) la hoja se identifica por el archivo y la página.
      const keyOf = (s) => s.key || `${file.name}|${file.size}|${s.pages[0].index}`;
      const fresh = sheets.filter((s) => !known.has(keyOf(s)));
      dup += sheets.length - fresh.length;
      if (!fresh.length) { PDF.forget(fileId); continue; }
      const papers = fresh.map((s) => ({
        id: uid(), fileId, fileName: file.name, fileSize: file.size, type: s.type, value: s.value, serie: s.serie, numero: s.numero,
        pages: s.pages, status: 'disponible', workId: null, uploadedAt: now(),
      }));
      try {
        await DB.put('files', { id: fileId, name: file.name, blob: file, addedAt: now() });
        await DB.putMany('papers', papers);
      } catch (err) {
        console.error(err);
        await DB.del('files', fileId).catch(() => {});
        PDF.forget(fileId);
        failed++;
        continue;
      }
      state.files.set(fileId, Promise.resolve(file));
      state.papers.push(...papers);
      added += papers.length;
    }
    const parts = [`${added} hoja${added === 1 ? '' : 's'} agregada${added === 1 ? '' : 's'}`];
    if (dup) parts.push(`${dup} repetida${dup === 1 ? '' : 's'} omitida${dup === 1 ? '' : 's'}`);
    if (failed) parts.push(`${failed} archivo${failed === 1 ? '' : 's'} no se pudo leer o guardar`);
    toast(parts.join(' · '));
    renderPapers();
  }

  function renderPapers() {
    const groups = new Map();
    for (const p of state.papers) {
      const k = p.type + '|' + (p.value ?? '?');
      if (!groups.has(k)) groups.set(k, { type: p.type, value: p.value, disponible: 0, asignado: 0, anulado: 0 });
      groups.get(k)[paperStatus(p)]++;
    }
    $('#papers-cards').innerHTML = [...groups.values()].sort((a, b) => a.type.localeCompare(b.type) || (b.value || 0) - (a.value || 0)).map((g) => `
      <div class="card ${esc(g.type)}">
        <div class="muted">${esc(cap(g.type))} · C$${esc(g.value ?? '?')}</div>
        <div class="big">${g.disponible}</div>
        <div class="muted">disponibles · ${g.asignado} asignadas · ${g.anulado} anuladas</div>
      </div>`).join('');

    const q = $('#papers-search').value.trim().toUpperCase();
    const type = $('#papers-type').value;
    const status = $('#papers-status').value;
    const rows = state.papers
      .filter((p) => (!type || p.type === type) && (!status || paperStatus(p) === status) &&
        (!q || `${p.serie || ''} ${p.numero || ''} C$${p.value ?? ''}`.toUpperCase().includes(q)))
      .sort((a, b) => a.type.localeCompare(b.type) || byNumber(a, b));
    if (!rows.length) {
      $('#papers-table').innerHTML = `<div class="empty">${state.papers.length ? 'No hay papel con esos filtros.' : 'Todavía no ha subido papel sellado.'}</div>`;
      return;
    }
    $('#papers-table').innerHTML = `<table>
      <thead><tr><th>Tipo</th><th>Valor</th><th>Serie</th><th>Número</th><th>Estado</th><th>Trabajo</th><th>Subido</th><th></th></tr></thead>
      <tbody>${rows.map((p) => {
        const st = paperStatus(p);
        const w = p.workId && workById(p.workId);
        return `<tr data-id="${esc(p.id)}">
          <td><span class="pill ${esc(p.type)}">${esc(cap(p.type))}</span></td>
          <td>C$${esc(p.value ?? '?')}</td><td>${esc(p.serie || '—')}</td><td>${esc(p.numero || '—')}</td>
          <td><span class="pill ${st}">${cap(st)}</span></td>
          <td>${w ? `<a href="#trabajo/${esc(w.id)}">${esc(w.title)}</a>` : '—'}</td>
          <td class="muted">${esc(fmtDate(p.uploadedAt))}</td>
          <td class="actions">
            <button class="btn small" data-act="view">Ver PDF</button>
            <button class="btn small" data-act="edit">Editar</button>
            ${st === 'asignado' ? '' : `<button class="btn small" data-act="void">${st === 'anulado' ? 'Reactivar' : 'Anular'}</button>`}
            ${st === 'asignado' ? '' : '<button class="btn small danger" data-act="delete">Eliminar</button>'}
          </td></tr>`;
      }).join('')}</tbody></table>`;
  }

  $('#papers-table').addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const p = paperById(btn.closest('tr').dataset.id);
    if (!p) return;
    const act = btn.dataset.act;
    if (act === 'view') {
      const blob = await fileBlob(p.fileId);
      if (!blob) return toast('No se encontró el PDF');
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } else if (act === 'edit') {
      const v = await formDialog($('#dlg-paper'), { type: p.type, value: p.value, serie: p.serie, numero: p.numero });
      if (!v) return;
      Object.assign(p, { type: v.type, value: v.value === '' ? null : Number(v.value), serie: v.serie.trim() || null, numero: v.numero.trim() || null });
      await DB.put('papers', p);
      renderPapers();
    } else if (act === 'void') {
      if (p.status !== 'anulado' && !(await confirmDialog('Anular papel', `La hoja ${p.serie || ''} Nº ${p.numero || ''} quedará marcada como anulada (inutilizada) y no se asignará a trabajos.`, 'Anular', true))) return;
      p.status = p.status === 'anulado' ? 'disponible' : 'anulado';
      await DB.put('papers', p);
      renderPapers();
    } else if (act === 'delete') {
      if (!(await confirmDialog('Eliminar papel', `Se borrará la hoja ${p.serie || ''} Nº ${p.numero || ''} de Lexia. El PDF original en su computadora no se toca.`, 'Eliminar', true))) return;
      await DB.del('papers', p.id);
      state.papers = state.papers.filter((x) => x.id !== p.id);
      if (!state.papers.some((x) => x.fileId === p.fileId)) { await DB.del('files', p.fileId); state.files.delete(p.fileId); PDF.forget(p.fileId); }
      renderPapers();
    }
  });

  const drop = $('#drop');
  drop.addEventListener('click', () => $('#file-pdf').click());
  drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#file-pdf').click(); } });
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); uploadFiles(e.dataTransfer.files); });
  $('#btn-upload').addEventListener('click', () => $('#file-pdf').click());
  $('#file-pdf').addEventListener('change', (e) => { uploadFiles(e.target.files); e.target.value = ''; });
  for (const id of ['#papers-search', '#papers-type', '#papers-status']) $(id).addEventListener('input', renderPapers);

  // ---------- trabajos ----------
  const plain = (w) => (w._plain ??= w.pages.join(' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').toLowerCase());

  function renderWorks() {
    const q = $('#works-search').value.trim().toLowerCase();
    const st = $('#works-status').value;
    const rows = state.works
      .filter((w) => (!st || w.status === st) && (!q || `${w.title} ${w.client}`.toLowerCase().includes(q) || plain(w).includes(q)))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    if (!rows.length) {
      $('#works-table').innerHTML = `<div class="empty">${state.works.length ? 'No hay trabajos con esos filtros.' : 'Todavía no tiene trabajos. Cree uno con “+ Nuevo trabajo”.'}</div>`;
      return;
    }
    $('#works-table').innerHTML = `<table>
      <thead><tr><th>Título</th><th>Cliente / partes</th><th>Papel</th><th>Hojas</th><th>Estado</th><th>Impresiones</th><th>Actualizado</th><th></th></tr></thead>
      <tbody>${rows.map((w) => {
        const sheets = Math.ceil(Math.max(1, w.pages.length) / 2);
        const assigned = w.paperIds.filter(Boolean).length;
        const last = w.printLog[w.printLog.length - 1];
        return `<tr data-id="${esc(w.id)}">
          <td><a href="#trabajo/${esc(w.id)}">${LABELS.includes(w.label) ? `<span class="tag ${w.label}" title="Etiqueta ${w.label}"></span>` : ''}<strong>${esc(w.title)}</strong></a>${w.protocolo ? `<div class="muted">${escrituras(w)} escritura${escrituras(w) === 1 ? '' : 's'}</div>` : ''}</td>
          <td>${w.protocolo ? '' : esc(w.client || '—')}</td>
          <td><span class="pill ${esc(w.kind)}">${esc(cap(w.kind))}${w.paperValue ? ' C$' + esc(w.paperValue) : ''}</span></td>
          <td>${sheets} <span class="muted">(${assigned} con papel)</span></td>
          <td>${w.protocolo ? (w.protocolo >= thisYear() ? '<span class="pill impreso" title="Se cierra el 31 de diciembre">Activo</span>' : '<span class="pill">Cerrado</span>') : `<span class="pill ${esc(w.status)}">${esc(cap(w.status))}</span>`}</td>
          <td class="muted">${w.printLog.length ? `${w.printLog.length} · ${esc(fmtDate(last.at))}` : '—'}</td>
          <td class="muted">${esc(fmtDate(w.updatedAt))}</td>
          <td class="actions">
            <button class="btn small" data-act="open">Abrir</button>
            <button class="btn small more" data-act="menu" popovertarget="work-menu" aria-label="Más acciones" title="Más acciones"><svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><circle cx="3" cy="8" r="1.2"/><circle cx="8" cy="8" r="1.2"/><circle cx="13" cy="8" r="1.2"/></svg></button>
          </td></tr>`;
      }).join('')}</tbody></table>`;
  }

  function newWork(fields) {
    const t = now();
    return {
      id: uid(), title: fields.title || 'Sin título', client: fields.client || '', kind: fields.kind || 'testimonio', paperValue: null,
      notes: '', status: 'borrador', createdAt: t, updatedAt: t, settings: { ...DEFAULT_SETTINGS },
      pages: ['<p><br></p>'], paperIds: [], printLog: [],
    };
  }

  // Nuevo trabajo, en blanco o desde un Word (con su texto y su letra); el diálogo pide nombre, partes y papel.
  async function askWork(fields = {}, doc = null, fileName = '') {
    const d = $('#dlg-work');
    d.querySelector('form').reset();
    $('#work-dlg-title').textContent = doc ? 'Importar documento de Word' : 'Nuevo trabajo';
    $('#work-dlg-ok').textContent = doc ? 'Importar' : 'Crear';
    $('#work-dlg-hint').hidden = !doc;
    if (doc) $('#work-dlg-hint').textContent = `«${fileName}» se acomoda en los renglones del papel sellado, con su negrita, cursiva, subrayado y alineación. Confirme el nombre y las partes.`;
    const v = await formDialog(d, fields);
    if (!v) return;
    const w = newWork(v);
    if (doc) {
      w.pages = [cleanStored(doc.html) || '<p><br></p>'];
      Object.assign(w.settings, docSettings(doc));
    }
    await DB.put('works', w);
    state.works.push(w);
    go('trabajo/' + w.id);
    if (doc) toast('Documento importado: revise el texto antes de imprimir.');
  }

  // Tipo y tamaño de letra del Word, si la suite los tiene.
  function docSettings(doc) {
    const font = FONTS.find(([, label]) => label.toLowerCase() === (doc.font || '').toLowerCase());
    return { ...(font && { font: font[0] }), ...(doc.size && { size: doc.size }) };
  }

  async function readDocx(file) {
    try { return await PS_DOCX.read(await file.arrayBuffer()); } catch (err) {
      console.error(err);
      toast('No se pudo leer el archivo: debe ser un documento de Word (.docx).');
      return null;
    }
  }

  $('#btn-new-work').addEventListener('click', () => askWork());
  $('#btn-word').addEventListener('click', () => $('#file-word').click());
  $('#file-word').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    const doc = file && await readDocx(file);
    if (doc) askWork({ title: file.name.replace(/\.docx$/i, '') }, doc, file.name);
  });

  // Menú «⋯» de cada trabajo: un solo popover que se coloca junto al botón que lo abre.
  const LABELS = ['rojo', 'naranja', 'amarillo', 'verde', 'azul'];
  const menu = $('#work-menu');
  let menuWork = null, pendingCopy = null;
  $('#works-table').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act]');
    const w = btn && workById(btn.closest('tr').dataset.id);
    if (!w) return;
    if (btn.dataset.act === 'open') go('trabajo/' + w.id);
    else { menuWork = w; menu.anchorButton = btn; }
  });
  menu.addEventListener('beforetoggle', (e) => {
    if (e.newState !== 'open') return;
    for (const b of menu.querySelectorAll('[data-label]')) b.setAttribute('aria-pressed', b.dataset.label === (menuWork.label || ''));
    menu.querySelector('[data-act=protocol]').hidden = !!menuWork.protocolo;
    // Alineado a la derecha del botón; hacia arriba si no cabe debajo.
    const r = menu.anchorButton.getBoundingClientRect();
    const up = r.bottom > innerHeight - 260;
    Object.assign(menu.style, { right: innerWidth - r.right + 'px', top: up ? 'auto' : r.bottom + 4 + 'px', bottom: up ? innerHeight - r.top + 4 + 'px' : 'auto' });
  });
  menu.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    const w = menuWork;
    if (!btn || !w) return;
    menu.hidePopover();
    if ('label' in btn.dataset) {
      w.label = btn.dataset.label || undefined;
      await DB.put('works', w);
      renderWorks();
    } else if (btn.dataset.act === 'protocol') {
      addToProtocol(w);
    } else if (btn.dataset.act === 'copy') {
      pendingCopy = w.id;
      go('trabajo/' + w.id);
    } else if (btn.dataset.act === 'dup') {
      const copy = { ...newWork(w), title: w.title + ' (copia)', client: w.client, kind: w.kind, paperValue: w.paperValue, notes: w.notes, label: w.label, settings: { ...w.settings }, pages: [...w.pages] };
      await DB.put('works', copy);
      state.works.push(copy);
      toast('Trabajo duplicado (sin papel asignado)');
      renderWorks();
    } else if (btn.dataset.act === 'delete') {
      const fate = w.printLog.length ? 'quedarán anuladas, porque el trabajo ya se imprimió' : 'quedarán disponibles otra vez';
      if (!(await confirmDialog('Eliminar trabajo', `Se borrará “${w.title}” y su texto. Las hojas de papel sellado asignadas ${fate}.`, 'Eliminar', true))) return;
      await releasePapers(w);
      await DB.del('works', w.id);
      state.works = state.works.filter((x) => x.id !== w.id);
      if (state.work === w) { state.work = null; clearTimeout(saveTimer); saveTimer = 0; }
      renderWorks();
    }
  });
  for (const id of ['#works-search', '#works-status']) $(id).addEventListener('input', renderWorks);

  // Una hoja de un trabajo ya impreso está gastada: al soltarla queda anulada, no disponible.
  function release(w, p) {
    p.workId = null;
    if (w.printLog.length) p.status = 'anulado';
  }

  async function releasePapers(w) {
    const changed = state.papers.filter((p) => p.workId === w.id);
    changed.forEach((p) => release(w, p));
    if (changed.length) await DB.putMany('papers', changed);
  }

  // ---------- editor ----------
  let saveTimer = 0, savedHtml = '';
  const setStatus = (t) => { $('#ed-status').textContent = t; };

  function openWork(id) {
    const w = workById(id);
    if (!w) { toast('No se encontró el trabajo'); go('trabajos'); return; }
    state.work = w;
    w.settings = { ...DEFAULT_SETTINGS, ...w.settings };
    savedHtml = JSON.stringify(w.pages);
    fillSide();
    Editor.mount($('#pages'), w, {
      paper: (pid) => { const p = paperById(pid); return p && p.workId === w.id ? p : null; },
      image: paperImage,
      status: toast,
      changed: onEditorChange,
      sheetAction,
    });
    updateCount();
    syncHide();
    setStatus('Guardado');
    if (pendingCopy === id) { pendingCopy = null; document.fonts.ready.then(() => setTimeout(() => print('texto', true), 100)); }
  }

  // «Ocultar lo impreso» solo tiene sentido después de anotar una impresión.
  function syncHide() {
    const b = $('#btn-hide-printed');
    b.disabled = !(state.work.printedChars > 0);
    b.setAttribute('aria-pressed', !b.disabled && state.work.settings.hidePrinted);
  }
  $('#btn-hide-printed').addEventListener('click', () => {
    const s = state.work.settings;
    s.hidePrinted = !s.hidePrinted;
    syncHide();
    Editor.refreshPrinted();
    saveMeta(() => {});
    toast(s.hidePrinted ? 'Lo ya impreso se ve gris y no se imprimirá: solo saldrá el texto nuevo.' : 'Se imprimirá todo el texto.');
  });

  function fillSide() {
    const w = state.work;
    // El protocolo no tiene cliente, tipo, estado ni notas: solo sus ajustes de papel, texto e impresión.
    $('#ed-work-fields').hidden = !!w.protocolo;
    $('#btn-datos').textContent = $('#datos-title').textContent = w.protocolo ? 'Ajustes' : 'Datos del trabajo';
    $('#ed-title').value = w.title;
    $('#ed-client').value = w.client;
    $('#ed-kind').value = w.kind;
    $('#ed-state').value = w.status;
    $('#ed-notes').value = w.notes;
    fillValues();
    const s = w.settings;
    $('#ed-font').innerHTML = FONTS.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('');
    $('#ed-font').value = s.font;
    $('#ed-size').value = s.size;
    $('#ed-indent').value = s.indent;
    $('#ed-ls').value = s.letterSpacing;
    $('#ed-ml').value = s.marginLeft;
    $('#ed-mr').value = s.marginRight;
    $('#ed-gap').value = s.gap;
    $('#ed-dashes').checked = s.dashes;
    $('#pr-x').value = state.app.printOffsetX;
    $('#pr-y').value = state.app.printOffsetY;
    renderLog();
  }

  function fillValues() {
    const w = state.work;
    const values = [...new Set(state.papers.filter((p) => p.type === w.kind && p.value != null).map((p) => p.value))].sort((a, b) => b - a);
    if (w.paperValue != null && !values.includes(w.paperValue)) values.push(w.paperValue);
    $('#ed-value').innerHTML = '<option value="">Cualquiera</option>' + values.map((v) => `<option value="${v}">C$${v}</option>`).join('');
    $('#ed-value').value = w.paperValue ?? '';
  }

  function renderLog() {
    const w = state.work;
    const items = [`Creado: ${fmtDate(w.createdAt)}`, `Última edición: ${fmtDate(w.updatedAt)}`,
      ...w.printLog.slice().reverse().map((l) => `Impreso ${l.mode === 'fondo' ? 'con papel' : 'solo texto'} (${l.pages} pág.): ${fmtDate(l.at)}`)];
    $('#ed-log').innerHTML = items.map((t) => `<li>${esc(t)}</li>`).join('');
  }

  function updateCount() {
    const w = state.work;
    const pages = Editor.pageCount();
    const sheets = Math.ceil(pages / 2);
    const assigned = w.paperIds.filter(Boolean).length;
    $('#ed-count').textContent = `${pages} cara${pages === 1 ? '' : 's'} · ${sheets} hoja${sheets === 1 ? '' : 's'} necesaria${sheets === 1 ? '' : 's'} · ${assigned} con papel sellado`;
  }

  function onEditorChange() {
    if (!state.work) return;
    updateCount();
    clearTimeout(saveTimer);
    if (JSON.stringify(Editor.pagesHtml()) === savedHtml) return;
    setStatus('Sin guardar…');
    saveTimer = setTimeout(saveWork, 800);
  }

  async function saveWork() {
    clearTimeout(saveTimer);
    saveTimer = 0;
    const w = state.work;
    if (!w || $('#view-editor').hidden || !workById(w.id)) return;
    const pages = Editor.pagesHtml();
    const json = JSON.stringify(pages);
    if (json === savedHtml) return; // sin cambios: no pisar lo que otra pestaña haya guardado
    w.pages = pages;
    w.updatedAt = now();
    delete w._plain;
    try {
      await DB.put('works', w);
      savedHtml = json;
      setStatus('Guardado ' + new Date().toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' }));
      renderLog();
    } catch (err) {
      console.error(err);
      setStatus('Sin guardar: ¡error!');
      toast('No se pudo guardar. Exporte un respaldo (incluye el texto actual) y revise el espacio del navegador.');
    }
  }

  const unsaved = () => !!state.work && !$('#view-editor').hidden && JSON.stringify(Editor.pagesHtml()) !== savedHtml;
  function flushSave() { if (unsaved()) saveWork(); }

  async function saveMeta(fn) {
    fn(state.work);
    state.work.updatedAt = now();
    await DB.put('works', state.work);
    setStatus('Guardado');
  }

  $('#ed-title').addEventListener('input', (e) => saveMeta((w) => { w.title = e.target.value.trim() || 'Sin título'; }));
  $('#ed-client').addEventListener('input', (e) => saveMeta((w) => { w.client = e.target.value.trim(); }));
  $('#ed-notes').addEventListener('input', (e) => saveMeta((w) => { w.notes = e.target.value; }));
  // Al terminar una escritura se ofrece agregarla al protocolo del año.
  $('#ed-state').addEventListener('change', async (e) => {
    const w = state.work;
    await saveMeta(() => { w.status = e.target.value; });
    if (w.status === 'finalizado' && !w.protocolo && !w.protocoloAt && protocolOf(thisYear())) addToProtocol(w);
  });
  $('#ed-kind').addEventListener('change', (e) => saveMeta((w) => { w.kind = e.target.value; w.paperValue = null; }).then(fillValues));
  $('#ed-value').addEventListener('change', (e) => saveMeta((w) => { w.paperValue = e.target.value === '' ? null : Number(e.target.value); }));

  // Ajustes de texto: cambian la geometría, así que se vuelve a paginar todo.
  const settingInputs = { '#ed-font': 'font', '#ed-size': 'size', '#ed-indent': 'indent', '#ed-ls': 'letterSpacing', '#ed-ml': 'marginLeft', '#ed-mr': 'marginRight', '#ed-gap': 'gap', '#ed-dashes': 'dashes' };
  for (const [sel, key] of Object.entries(settingInputs)) {
    $(sel).addEventListener('change', (e) => {
      const el = e.target;
      let v = el.type === 'checkbox' ? el.checked : el.type === 'number' ? Number(el.value) : el.value;
      if (el.type === 'number') {
        if (!Number.isFinite(v) || el.value === '') v = DEFAULT_SETTINGS[key];
        v = Math.min(Math.max(v, Number(el.min ?? -Infinity)), Number(el.max || Infinity));
        el.value = v;
      }
      state.work.settings[key] = v;
      Editor.applySettings();
      saveMeta(() => {});
    });
  }

  for (const [sel, key] of [['#pr-x', 'printOffsetX'], ['#pr-y', 'printOffsetY']]) {
    $(sel).addEventListener('change', async (e) => {
      const v = Number(e.target.value);
      state.app[key] = Number.isFinite(v) ? Math.max(-30, Math.min(30, v)) : 0;
      e.target.value = state.app[key];
      await DB.put('settings', state.app);
    });
  }

  // Barra de formato: mousedown sin foco para no perder la selección del texto.
  document.querySelector('.toolbar').addEventListener('mousedown', (e) => { if (e.target.closest('[data-cmd]')) e.preventDefault(); });
  document.querySelector('.toolbar').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cmd]');
    if (!b) return;
    const cmd = b.dataset.cmd;
    if (cmd === 'undo') Editor.undo();
    else if (cmd === 'redo') Editor.redo();
    else Editor.format(cmd);
  });

  $('#btn-datos').addEventListener('click', () => $('#dlg-datos').showModal());

  // Modo claro (por omisión) u oscuro; se recuerda en este navegador. El cambio se abre en círculo desde el botón.
  const root = document.documentElement;
  function syncTheme() {
    const dark = root.dataset.theme === 'dark';
    $('#btn-theme').setAttribute('aria-label', dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    $('#btn-theme').title = dark ? 'Modo claro' : 'Modo oscuro';
  }
  $('#btn-theme').addEventListener('click', (e) => {
    const dark = root.dataset.theme !== 'dark';
    const apply = () => { if (dark) root.dataset.theme = 'dark'; else delete root.dataset.theme; syncTheme(); };
    try { localStorage.setItem('lexia-theme', dark ? 'dark' : 'light'); } catch {}
    if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) { apply(); return; }
    const r = e.currentTarget.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.classList.add('theme-switch');
    const t = document.startViewTransition(apply);
    t.ready.then(() => root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
      { duration: 550, easing: 'cubic-bezier(.22,1,.36,1)', pseudoElement: '::view-transition-new(root)' }));
    t.finished.finally(() => root.classList.remove('theme-switch'));
  });
  syncTheme();

  // Fondo en pantalla: normal, atenuado u oculto (la impresión no cambia). Se recuerda en este navegador.
  function setBg(mode) {
    document.body.classList.remove('bg-dim', 'bg-off');
    if (mode) document.body.classList.add(mode);
    for (const b of document.querySelectorAll('#bg-mode [data-bg]')) b.setAttribute('aria-pressed', b.dataset.bg === mode);
    try { localStorage.setItem('pss-bg', mode); } catch {}
  }
  $('#bg-mode').addEventListener('click', (e) => { const b = e.target.closest('[data-bg]'); if (b) setBg(b.dataset.bg); });
  try { setBg(localStorage.getItem('pss-bg') || ''); } catch { setBg(''); }

  // ---------- protocolo ----------
  // El protocolo del año es un trabajo más (w.protocolo = año): un solo documento que crece con cada escritura y
  // queda activo hasta el 31 de diciembre. Se empieza con el acta de apertura o subiendo el que se lleva en Word.
  const thisYear = () => new Date().getFullYear();
  const protocolOf = (year) => state.works.find((w) => w.protocolo === year) || null;
  const escrituras = (w) => (plain(w).match(/escritura\s+p[úu]blica\s+n[úu]mero/g) || []).length;

  $('#btn-protocolo').addEventListener('click', async () => {
    const open = protocolOf(thisYear());
    if (open) { go('trabajo/' + open.id); return; }
    const d = $('#dlg-protocolo');
    $('#protocolo-anio').value = thisYear();
    d.returnValue = '';
    d.showModal();
    const how = await new Promise((r) => d.addEventListener('close', () => r(d.returnValue), { once: true }));
    const year = Math.round(Number($('#protocolo-anio').value)) || thisYear();
    if (how === 'docx') { $('#file-docx').dataset.year = year; $('#file-docx').click(); }
    else if (how === 'nuevo') {
      const apertura = PLANTILLAS.find((t) => t.id === 'apertura-protocolo');
      await createProtocol(year, PS_TEMPLATES.build(apertura, { ...Profile.get(), protocoloAnio: String(year) }, new Date(), ''));
    }
  });

  $('#file-docx').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const doc = await readDocx(file);
    if (doc) await createProtocol(Number(e.target.dataset.year), cleanStored(doc.html), docSettings(doc));
  });

  async function createProtocol(year, html, settings) {
    if (protocolOf(year)) { toast(`Ya existe el protocolo ${year}.`); return; }
    const w = newWork({ title: `Protocolo ${year}`, kind: 'protocolo' });
    Object.assign(w, { protocolo: year, pages: [html || '<p><br></p>'] });
    Object.assign(w.settings, settings);
    await DB.put('works', w);
    state.works.push(w);
    go('trabajo/' + w.id);
    toast(`Protocolo ${year}: ${escrituras(w)} escritura${escrituras(w) === 1 ? '' : 's'}. Agregue cada escritura terminada desde su menú «⋯» o al marcarla «Finalizado».`);
  }

  // Agrega el texto de un trabajo al final del protocolo del año (los párrafos partidos entre páginas se juntan).
  async function addToProtocol(w) {
    const p = protocolOf(thisYear());
    if (!p) { toast(`Primero cree o suba su protocolo ${thisYear()} con el botón «Protocolo» de Mis trabajos.`); return; }
    if (state.work === w) await saveWork();
    const n = escrituras(p), pending = w.pages.join('').split('class="campo"').length - 1;
    const text = [`«${w.title}» se agregará al final del protocolo ${p.protocolo}, que tiene ${n} escritura${n === 1 ? '' : 's'}.`,
      pending && `Tiene ${pending} campo${pending === 1 ? '' : 's'} sin completar.`, w.protocoloAt && `Ya se agregó el ${fmtDate(w.protocoloAt)}.`].filter(Boolean).join(' ');
    if (!(await confirmDialog('Agregar al protocolo', text, 'Agregar'))) return;
    const html = Editor.joinPages(w.pages);
    p.pages = plain(p).trim() ? [...p.pages.slice(0, -1), p.pages[p.pages.length - 1] + html] : [html];
    p.updatedAt = w.protocoloAt = now();
    delete p._plain;
    await DB.putMany('works', [p, w]);
    toast(`Agregado al protocolo ${p.protocolo}: ahora tiene ${escrituras(p)} escritura${escrituras(p) === 1 ? '' : 's'}.`);
    if (!$('#view-works').hidden) renderWorks();
  }

  // En Plantillas, el Nº de escritura sigue al protocolo del año.
  $('#btn-templates').addEventListener('click', () => {
    const p = protocolOf(thisYear());
    if (!p || p === state.work && unsaved()) return;
    $('#tpl-num').value = escrituras(p) + 1;
    $('#tpl-num').dispatchEvent(new Event('input'));
  });

  // ---------- asignación de papel ----------
  const matches = (w, p) => p.type === w.kind && (w.paperValue == null || p.value === w.paperValue);
  const available = (w, all) => state.papers.filter((p) => paperStatus(p) === 'disponible' && (all || matches(w, p)))
    .sort((a, b) => (b.value || 0) - (a.value || 0) || byNumber(a, b));

  async function assign(sheet, paper) {
    const w = state.work;
    const prev = paperById(w.paperIds[sheet]);
    while (w.paperIds.length <= sheet) w.paperIds.push(null);
    w.paperIds[sheet] = paper ? paper.id : null;
    while (w.paperIds.length && !w.paperIds[w.paperIds.length - 1]) w.paperIds.pop();
    const changed = [];
    if (prev && prev.workId === w.id) { release(w, prev); changed.push(prev); }
    if (paper) { paper.workId = w.id; changed.push(paper); }
    if (changed.length) await DB.putMany('papers', changed);
    w.updatedAt = now();
    await DB.put('works', w);
  }

  async function sheetAction(sheet, action) {
    if (state.work.printLog.length && state.work.paperIds[sheet] &&
      !(await confirmDialog('Este trabajo ya se imprimió', 'La hoja que quite quedará anulada en el inventario (se considera gastada).', 'Continuar', true))) return;
    if (action === 'remove') {
      await assign(sheet, null);
    } else {
      const picked = await pickPaper(`Papel para la hoja ${sheet + 1}`);
      if (!picked) return;
      await assign(sheet, picked);
    }
    Editor.relayout();
    updateCount();
  }

  function pickPaper(title) {
    const d = $('#dlg-pick');
    $('#pick-title').textContent = title;
    const render = () => {
      const list = available(state.work, $('#pick-all').checked);
      $('#pick-list').innerHTML = list.length ? list.map((p, i) => `
        <label><input type="radio" name="pick" value="${esc(p.id)}" ${i === 0 ? 'checked' : ''}>
        <span><strong>${esc(cap(p.type))} C$${esc(p.value ?? '?')}</strong> · Serie ${esc(p.serie || '—')} Nº ${esc(p.numero || '—')}</span></label>`).join('')
        : '<div class="empty">No hay papel disponible de este tipo. Suba más PDF en “Papel sellado” o marque “Mostrar todos”.</div>';
    };
    $('#pick-all').checked = false;
    $('#pick-all').onchange = render;
    render();
    d.returnValue = '';
    d.showModal();
    return new Promise((r) => d.addEventListener('close', () => {
      const id = d.querySelector('input[name=pick]:checked')?.value;
      r(d.returnValue === 'ok' && id ? paperById(id) : null);
    }, { once: true }));
  }

  $('#btn-autoassign').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const w = state.work;
    const needed = Math.ceil(Editor.pageCount() / 2);
    // Todas las hojas de un trabajo deben ser del mismo valor: el del papel ya asignado o el mayor disponible.
    const value = w.paperValue ?? paperById(w.paperIds.find(Boolean))?.value ?? available(w, false)[0]?.value;
    let done = 0;
    btn.disabled = true;
    try {
      for (let s = 0; s < needed; s++) {
        if (paperById(w.paperIds[s])?.workId === w.id) continue;
        const p = available(w, false).find((x) => x.value === value);
        if (!p) break;
        await assign(s, p);
        done++;
      }
    } finally { btn.disabled = false; }
    const missing = Array.from({ length: needed }, (_, s) => s).filter((s) => !w.paperIds[s]).length;
    toast(missing ? `Se asignaron ${done} hojas. Faltan ${missing} hojas de ${w.kind}${value ? ' C$' + value : ''}.` : `Listo: ${done} hoja${done === 1 ? '' : 's'} asignada${done === 1 ? '' : 's'}.`);
    Editor.relayout();
    updateCount();
  });

  // ---------- impresión ----------
  let printing = null; // impresión en curso: evita dobles clics y se registra al cerrar el diálogo

  // Caras que salen en el modo dado (con papel, solo las que tienen papel asignado); 0 si no se sigue.
  async function facesFor(mode) {
    const pages = Editor.pageCount();
    if (mode !== 'fondo') return pages;
    const withPaper = Array.from({ length: pages }, (_, i) => Editor.paperForPage(i)?.pages[i % 2]).filter(Boolean).length;
    if (!withPaper) { toast('Asigne papel sellado a las hojas para imprimir con el papel de fondo.'); return 0; }
    if (withPaper < pages && !(await confirmDialog('Hay hojas sin papel', `${pages - withPaper} de ${pages} caras no tienen papel sellado asignado y quedarán fuera. ¿Seguir con las demás?`, 'Seguir'))) return 0;
    return withPaper;
  }

  // copy: copia completa (todo el texto, sin corrimiento de impresora) que no se anota en el historial.
  async function print(mode, copy = false) {
    if (printing) return;
    const w = state.work;
    const printed = await facesFor(mode);
    if (!printed) return;
    printing = { w, mode, pages: printed, copy, chars: Editor.printedUpTo(mode) };
    if (copy) Editor.refreshPrinted(true);
    for (const b of document.querySelectorAll('#btn-print-fondo, #btn-print-texto')) b.disabled = true;
    await saveWork();
    setStatus('Preparando impresión…');
    try {
      await Editor.preparePrint(mode, (n, total) => setStatus(`Preparando impresión ${n}/${total}…`));
    } catch (err) {
      console.error(err);
      toast('No se pudo preparar el papel sellado para imprimir');
      endPrint();
      return;
    }
    document.body.dataset.print = mode;
    document.body.style.setProperty('--print-ox', (copy ? 0 : state.app.printOffsetX) + 'mm');
    document.body.style.setProperty('--print-oy', (copy ? 0 : state.app.printOffsetY) + 'mm');
    setStatus('Guardado');
    setTimeout(() => window.print(), 50);
  }

  function endPrint() {
    if (printing?.copy) Editor.refreshPrinted();
    printing = null;
    delete document.body.dataset.print;
    for (const b of document.querySelectorAll('#btn-print-fondo, #btn-print-texto')) b.disabled = false;
  }

  // El navegador no dice si se canceló: se pregunta antes de anotarlo en el historial
  // (una hoja de un trabajo impreso se considera gastada).
  window.addEventListener('afterprint', async () => {
    const job = printing;
    endPrint();
    if (!job || job.copy) return;
    if (await confirmDialog('¿Se imprimió?', 'Confirme si el documento se imprimió, para anotarlo en el historial del trabajo.', 'Sí, se imprimió')) await recordPrint(job);
  });

  // Anota una impresión: historial, estado y hasta dónde quedó impreso el texto (para «Ocultar lo impreso»).
  async function recordPrint(job) {
    job.w.printLog.push({ at: now(), mode: job.mode, pages: job.pages });
    if (job.w.status === 'borrador') job.w.status = 'impreso';
    job.w.printedChars = job.chars;
    await DB.put('works', job.w);
    if (state.work === job.w) { $('#ed-state').value = job.w.status; renderLog(); syncHide(); Editor.refreshPrinted(); }
  }
  $('#btn-print-fondo').addEventListener('click', () => print('fondo'));
  // Ctrl+P en el editor usa la impresión de Lexia (con papel si hay papel asignado).
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p' && !$('#view-editor').hidden) {
      e.preventDefault();
      print(state.work.paperIds.some(Boolean) ? 'fondo' : 'texto');
    }
  });
  $('#btn-print-texto').addEventListener('click', () => print('texto'));

  // PDF tamaño legal: algunas impresoras no toman el tamaño de la página desde el navegador; desde un visor de PDF sí.
  $('#btn-pdf').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const d = $('#dlg-pdf');
    d.returnValue = '';
    d.showModal();
    const mode = await new Promise((r) => d.addEventListener('close', () => r(d.returnValue), { once: true }));
    if ((mode !== 'fondo' && mode !== 'texto') || !(await facesFor(mode))) return;
    btn.disabled = true;
    try {
      await saveWork();
      const mm = 72 / 25.4;
      const chars = Editor.printedUpTo(mode);
      const pages = await Editor.pdfPages(mode, { x: state.app.printOffsetX * mm, y: state.app.printOffsetY * mm }, (n, total) => setStatus(`Preparando PDF ${n}/${total}…`));
      const a = document.createElement('a');
      a.href = URL.createObjectURL(await PDF.write(pages));
      a.download = `${state.work.title.replace(/[\\/:*?"<>|]+/g, '-')}${mode === 'texto' ? ' (solo texto)' : ''}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 60000);
      toast(`PDF descargado: ${pages.length} página${pages.length === 1 ? '' : 's'} tamaño legal.`);
      if (await confirmDialog('¿Va a imprimir este PDF en el papel sellado?', 'Si lo imprime, anótelo: queda en el historial y, con «Ocultar lo impreso», la próxima vez solo saldrá el texto nuevo.', 'Anotar como impreso')) {
        await recordPrint({ w: state.work, mode, pages: pages.length, chars });
      }
    } catch (err) {
      console.error(err);
      toast('No se pudo preparar el PDF');
    } finally {
      btn.disabled = false;
      setStatus('Guardado');
    }
  });

  // ---------- respaldo ----------
  const blobToDataUrl = (b) => new Promise((r, j) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.onerror = () => j(fr.error); fr.readAsDataURL(b); });

  $('#btn-export').addEventListener('click', async () => {
    if (unsaved()) await saveWork();
    if (state.work && unsaved()) state.work.pages = Editor.pagesHtml(); // aunque el guardado falle, el respaldo lleva el texto actual
    toast('Preparando respaldo…');
    const files = await DB.all('files');
    const out = {
      app: 'papel-sellado-suite', version: 1, exportedAt: now(),
      files: await Promise.all(files.map(async (f) => ({ id: f.id, name: f.name, addedAt: f.addedAt, data: await blobToDataUrl(await fileBlob(f.id)) }))),
      papers: state.papers, works: state.works.map(({ _plain, ...w }) => w), settings: state.app, profile: Profile.filled() ? Profile.get() : undefined,
    };
    const blob = new Blob([JSON.stringify(out)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `respaldo-lexia-${now().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    toast(`Respaldo descargado: ${out.works.length} trabajos, ${out.papers.length} hojas.`);
  });

  // El respaldo viene de un archivo: se valida y el HTML de los trabajos se limpia antes de guardarlo.
  // SPAN solo como mitad de firma (f2) o campo de plantilla (campo); P puede ser línea de firma (class="firma").
  const ALLOWED = new Set(['P', 'B', 'I', 'U', 'BR', 'SPAN']);
  function cleanStored(html) {
    const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
    const rootEl = doc.body.firstChild;
    for (const el of [...rootEl.querySelectorAll('*')].reverse()) {
      if (/^(SCRIPT|STYLE|TEMPLATE|IFRAME|OBJECT)$/.test(el.nodeName)) { el.remove(); continue; }
      if (!ALLOWED.has(el.nodeName) || (el.nodeName === 'SPAN' && !/^(f2|campo)$/.test(el.getAttribute('class') || ''))) { el.replaceWith(...el.childNodes); continue; }
      for (const a of [...el.attributes]) {
        const keep = el.nodeName === 'SPAN' ? a.name === 'class'
          : el.nodeName === 'P' && (a.name === 'data-cont' || a.name === 'data-split' || (a.name === 'class' && a.value === 'firma') || (a.name === 'style' && /^text-align:\s*(left|center|right|justify);?$/.test(a.value.trim())));
        if (!keep) el.removeAttribute(a.name);
      }
    }
    return rootEl.innerHTML;
  }

  const str = (v) => (typeof v === 'string' ? v : v == null ? '' : String(v));
  const num = (v) => (Number.isFinite(Number(v)) && v !== null && v !== '' ? Number(v) : null);

  $('#btn-import').addEventListener('click', () => $('#file-backup').click());
  $('#file-backup').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    let data;
    try { data = JSON.parse(await file.text()); } catch { toast('El archivo no es un respaldo válido'); return; }
    if (data?.app !== 'papel-sellado-suite' || !Array.isArray(data.works) || !Array.isArray(data.papers) || !Array.isArray(data.files)) { toast('El archivo no es un respaldo de Lexia'); return; }
    if (!(await confirmDialog('Importar respaldo', `Se importarán ${data.works.length} trabajos y ${data.papers.length} hojas${data.profile ? ', y sus datos de «Mis datos»' : ''}. Los que ya existan con el mismo identificador se reemplazarán.`, 'Importar'))) return;
    try {
      const files = [];
      for (const f of data.files) {
        if (typeof f.data !== 'string' || !f.data.startsWith('data:')) continue;
        const blob = new Blob([await (await fetch(f.data)).blob()], { type: 'application/pdf' });
        files.push({ id: str(f.id), name: str(f.name), addedAt: str(f.addedAt), blob });
      }
      const fileIds = new Set(files.map((f) => f.id));
      const geometry = (g) => Object.fromEntries(Object.entries({ ...PS_PARSE.DEFAULT_GEOMETRY, ...(g || {}) }).map(([k, v]) => [k, num(v) ?? PS_PARSE.DEFAULT_GEOMETRY[k]]));
      const papers = data.papers.filter((p) => fileIds.has(str(p.fileId))).map((p) => ({
        id: str(p.id), fileId: str(p.fileId), fileName: str(p.fileName), type: ['testimonio', 'protocolo'].includes(p.type) ? p.type : 'otro',
        value: num(p.value), serie: str(p.serie) || null, numero: str(p.numero) || null, status: p.status === 'anulado' ? 'anulado' : 'disponible',
        workId: str(p.workId) || null, uploadedAt: str(p.uploadedAt) || now(),
        pages: (Array.isArray(p.pages) ? p.pages : []).map((pg) => ({ index: num(pg.index) ?? 0, side: pg.side === 'reverso' ? 'reverso' : 'frente', geometry: geometry(pg.geometry) })),
      }));
      const works = data.works.map((w) => ({
        id: str(w.id), title: str(w.title) || 'Sin título', client: str(w.client), kind: ['testimonio', 'protocolo'].includes(w.kind) ? w.kind : 'otro',
        paperValue: num(w.paperValue), notes: str(w.notes), status: ['borrador', 'impreso', 'finalizado'].includes(w.status) ? w.status : 'borrador',
        createdAt: str(w.createdAt) || now(), updatedAt: str(w.updatedAt) || now(),
        settings: { ...DEFAULT_SETTINGS, ...Object.fromEntries(Object.entries(w.settings || {}).filter(([k, v]) => k in DEFAULT_SETTINGS && typeof v === typeof DEFAULT_SETTINGS[k])) },
        pages: (Array.isArray(w.pages) ? w.pages : []).map((h) => cleanStored(str(h))),
        paperIds: (Array.isArray(w.paperIds) ? w.paperIds : []).map((id) => str(id) || null),
        printLog: (Array.isArray(w.printLog) ? w.printLog : []).map((l) => ({ at: str(l.at), mode: l.mode === 'fondo' ? 'fondo' : 'texto', pages: num(l.pages) ?? 0 })),
        printedChars: Math.max(0, num(w.printedChars) ?? 0), label: LABELS.includes(w.label) ? w.label : undefined,
        protocolo: Number.isInteger(num(w.protocolo)) ? num(w.protocolo) : undefined, protocoloAt: str(w.protocoloAt) || undefined,
      }));
      for (const w of works) w.settings.font = FONTS.some(([v]) => v === w.settings.font) ? w.settings.font : DEFAULT_SETTINGS.font;
      // Lo local manda: una hoja que ya existe conserva su estado y trabajo actuales; no se duplica una serie-número.
      const localById = new Map(state.papers.map((p) => [p.id, p]));
      const localKeys = new Set(state.papers.filter((p) => p.serie && p.numero).map((p) => p.serie + '-' + p.numero));
      const newPapers = papers.filter((p) => {
        const local = localById.get(p.id);
        if (local) { p.workId = local.workId; p.status = local.status; return true; }
        return !(p.serie && p.numero && localKeys.has(p.serie + '-' + p.numero));
      });
      await DB.putMany('files', files);
      await DB.putMany('papers', newPapers);
      await DB.putMany('works', works);
      if (data.profile && typeof data.profile === 'object') await Profile.save(data.profile);
      files.forEach((f) => { state.files.delete(f.id); PDF.forget(f.id); });
      await loadAll();
      // Cada trabajo solo conserva las hojas que de verdad le pertenecen.
      const fixed = state.works.filter((w) => {
        const ids = w.paperIds.map((id) => (paperById(id)?.workId === w.id ? id : null));
        while (ids.length && !ids[ids.length - 1]) ids.pop();
        if (JSON.stringify(ids) === JSON.stringify(w.paperIds)) return false;
        w.paperIds = ids;
        return true;
      });
      if (fixed.length) await DB.putMany('works', fixed);
      toast(`Respaldo importado: ${works.length} trabajos, ${papers.length} hojas.`);
      route();
    } catch (err) {
      console.error(err);
      toast('No se pudo importar el respaldo');
    }
  });

  // ---------- inicio ----------
  window.addEventListener('hashchange', route);
  document.addEventListener('visibilitychange', () => { if (document.hidden) flushSave(); });
  window.addEventListener('beforeunload', (e) => { if (unsaved()) { saveWork(); e.preventDefault(); e.returnValue = ''; } });

  (async () => {
    // Una sola pestaña a la vez: dos pestañas editando lo mismo se pisarían al guardar.
    const alone = await new Promise((resolve) => {
      if (!navigator.locks) return resolve(true);
      navigator.locks.request('papel-sellado-suite', { ifAvailable: true }, (lock) => { resolve(!!lock); return lock ? new Promise(() => {}) : null; });
    });
    if (!alone) {
      document.querySelector('main').innerHTML = '<div class="empty">Lexia ya está abierta en otra pestaña o ventana. Use esa, o ciérrela y recargue esta página, para no sobrescribir sus trabajos.</div>';
      return;
    }
    // Con Firebase configurado, Lexia pide cuenta; sin configurar, todo queda en este navegador como antes.
    if (Cloud.enabled) {
      if (!Cloud.resume()) await login();
      await openAccount();
      await paywall();
    }
    try {
      navigator.storage?.persist?.(); // pide al navegador no borrar los datos por falta de espacio
      await loadAll();
      await Profile.init();
    } catch (err) {
      console.error(err);
      document.querySelector('main').innerHTML = '<div class="empty">Este navegador no permite guardar datos locales (IndexedDB). Use Chrome, Edge o Firefox y no el modo privado.</div>';
      return;
    }
    if (!location.hash) location.hash = 'trabajos';
    route();
  })();
})();
