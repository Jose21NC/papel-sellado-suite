// Plantillas: buscar, ver y poner en el documento los modelos de js/templates-data.js, con los datos de «Mis datos»
// y la fecha y hora en letras. build() es pura (se prueba en Node); el resto conecta el diálogo.
(function (root) {
  const W = root.PS_WORDS || require('./words.js');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const up = (s) => s.toLocaleUpperCase('es');
  const LABELS = {
    NUMERO: 'NÚMERO EN LETRAS (EN CIFRAS)', CIUDAD: 'CIUDAD', NOTARIO: 'NOMBRE DEL NOTARIO', TITULO: 'Abogado y Notario Público',
    DOMICILIO: 'DOMICILIO DEL NOTARIO', CARNET: 'NÚMERO DE CARNÉ', CEDULA_NOTARIO: 'CÉDULA DEL NOTARIO',
    QUINQUENIO: 'FECHA EN QUE VENCE EL QUINQUENIO', OFICINA: 'DIRECCIÓN DE LA OFICINA', PROTOCOLO: 'NÚMERO DE PROTOCOLO',
  };

  // Valores de los {CAMPOS}. Los datos de notario solo se llenan si el perfil dice que es notario.
  function values(p, d, num) {
    const nv = (v) => (p.notario === 'si' ? v : '');
    const fem = /abogada|notaria/i.test(p.titulo || '');
    const inWords = (n) => { const x = Number(n); return Number.isInteger(x) && x > 0 && x < 1e6 ? `${up(W.numberToWords(x))} (${x})` : ''; };
    const year = Number(p.protocoloAnio);
    return {
      NUMERO: inWords(num), CIUDAD: p.ciudad, HORA_FECHA: W.dateTimeToWords(d), FECHA: W.dateToWords(d), OFICINA: p.oficina,
      NOTARIO: nv(up(p.nombre || '')), TITULO: nv(p.titulo), DOMICILIO: nv(p.domicilio), CARNET: nv(p.carnet), CEDULA_NOTARIO: nv(p.cedula),
      QUINQUENIO: nv(W.isoDateToWords(p.quinquenio)), PROTOCOLO: nv(inWords(p.protocolo)),
      PROTOCOLO_ANIO: W.numberToWords(year >= 1900 && year <= 2200 ? year : d.getFullYear()),
      AUTORIZADO: fem ? 'autorizada' : 'autorizado', EL_NOTARIO: fem ? 'la Notaria' : 'el Notario', SUSCRITO: fem ? 'la suscrita Notaria' : 'el suscrito Notario',
    };
  }

  // HTML de la plantilla: su texto es confiable; los datos del perfil se escapan. [CAMPO] queda resaltado.
  function build(t, profile, d, num) {
    const v = values(profile || {}, d, num);
    return t.body.map((par) => {
      const center = par.startsWith('^');
      const html = (center ? par.slice(1) : par)
        .replace(/\[[^\]]+\]/g, (m) => `<span class="campo">${m}</span>`)
        .replace(/\{([A-Z_]+)\}/g, (m, k) => (v[k] ? esc(v[k]) : `<span class="campo">[${esc(LABELS[k] || k)}]</span>`));
      return `<p${center ? ' style="text-align:center"' : ''}>${html}</p>`;
    }).join('');
  }

  if (typeof module !== 'undefined' && module.exports) { module.exports = { build }; return; }

  // ---------- diálogo ----------
  const $ = (s) => document.querySelector(s);
  const d = $('#dlg-templates');
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const haystack = new Map(PLANTILLAS.map((t) => [t.id, norm(`${t.cat} ${t.title} ${t.tags || ''} ${t.note || ''}`)]));
  let selected = null;
  $('#tpl-cat').insertAdjacentHTML('beforeend', [...new Set(PLANTILLAS.map((t) => t.cat))].map((c) => `<option>${esc(c)}</option>`).join(''));

  const current = () => PLANTILLAS.find((t) => t.id === selected);

  function renderList() {
    const words = norm($('#tpl-q').value).split(/\s+/).filter(Boolean);
    const cat = $('#tpl-cat').value;
    const list = PLANTILLAS.filter((t) => (!cat || t.cat === cat) && words.every((w) => haystack.get(t.id).includes(w)));
    if (!list.some((t) => t.id === selected)) selected = list[0]?.id || null;
    let html = '', last = '';
    for (const t of list) {
      if (t.cat !== last) { html += `<h4>${esc(t.cat)}</h4>`; last = t.cat; }
      html += `<label><input type="radio" name="tpl" value="${esc(t.id)}"${t.id === selected ? ' checked' : ''}> ${esc(t.title)}</label>`;
    }
    $('#tpl-list').innerHTML = html || '<div class="empty">No hay plantillas con esa búsqueda.</div>';
    preview();
  }

  function preview() {
    const t = current();
    $('#tpl-preview').innerHTML = t ? `<div class="note">Modelo de referencia: revíselo y adáptelo al caso antes de usarlo.${t.note ? ' ' + esc(t.note) : ''}</div>` +
      build(t, Profile.get(), new Date(), $('#tpl-num').value) : '';
    d.querySelector('button[value=ok]').disabled = !t;
  }

  $('#tpl-list').addEventListener('change', (e) => { selected = e.target.value; preview(); });
  $('#tpl-q').addEventListener('input', renderList);
  $('#tpl-q').addEventListener('keydown', (e) => { if (e.key === 'Enter') e.preventDefault(); }); // Enter busca, no inserta
  $('#tpl-cat').addEventListener('change', renderList);
  $('#tpl-num').addEventListener('input', preview);
  $('#btn-templates').addEventListener('click', () => {
    renderList();
    d.returnValue = '';
    d.showModal();
    $('#tpl-q').select();
  });
  d.addEventListener('close', () => {
    const t = current();
    if (d.returnValue === 'ok' && t) Editor.insertHtml(build(t, Profile.get(), new Date(), $('#tpl-num').value));
  });

  // Un clic en un campo [ASÍ] lo selecciona entero: lo que se escriba lo reemplaza.
  $('#pages').addEventListener('click', (e) => {
    const c = e.target.closest?.('.campo');
    const s = getSelection();
    if (!c || !s.isCollapsed) return;
    const r = document.createRange();
    r.selectNodeContents(c);
    s.removeAllRanges();
    s.addRange(r);
  });
})(this);
