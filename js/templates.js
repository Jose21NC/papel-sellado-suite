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

  // Cómo se escribe cada campo [ASÍ] según su nombre.
  function fieldKind(label) {
    if (/^FECHA EN (LETRAS|QUE VENCE)/.test(label)) return 'fecha';
    if (label === 'HORA EN LETRAS') return 'hora';
    if (/CÉDULA|PASAPORTE|MOTOR|CHASIS|PLACA|CIRCULACIÓN|SERIE/.test(label)) return 'codigo';
    if (label === 'PORCENTAJE') return 'porcentaje';
    if (/ EN LETRAS$/.test(label)) return 'letras';
    if (/^(NÚMERO|TOMO|FOLIO|ASIENTO|DÍA|AÑO)( DE FINCA| DE PROTOCOLO| DE CARNÉ| CATASTRAL| EN LETRAS \(EN CIFRAS\))?$|^CARNÉ$/.test(label)) return 'numero';
    return 'texto';
  }

  // Texto que queda en el documento para el dato v; '' si el dato no sirve.
  function fieldText(kind, v) {
    v = v.trim();
    if (!v) return '';
    if (kind === 'fecha') return W.isoDateToWords(v);
    if (kind === 'hora') { const m = /^(\d{1,2}):(\d{2})/.exec(v); return m ? W.timeToWords(new Date(2000, 0, 1, +m[1], +m[2])) : ''; }
    if (kind === 'codigo') return W.spellCode(v);
    const words = W.amountToWords(v);
    if (kind === 'letras') return words ?? W.spellCode(v);
    if (kind === 'numero') return `${words ?? W.spellCode(v)} (${v})`;
    if (kind === 'porcentaje') return words ? `${words} por ciento (${v} %)` : v;
    return v;
  }

  if (typeof module !== 'undefined' && module.exports) { module.exports = { build, fieldKind, fieldText }; return; }

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

  // ---------- campos [ASÍ]: un clic abre un diálogo que escribe el dato como lo pide la escritura ----------
  const dc = $('#dlg-campo');
  const input = $('#campo-input');
  const HINTS = {
    codigo: 'Escríbalo como aparece en el documento (p. ej. 001-010190-0001A): se pone en letras, carácter por carácter.',
    letras: 'Escriba la cifra (p. ej. 1,500 o 250.75): se pone en letras.',
    numero: 'Escriba la cifra: se pone en letras y, entre paréntesis, en cifras.',
    porcentaje: 'Escriba el porcentaje en cifras: se pone en letras y en cifras.',
    fecha: 'Elija la fecha: se pone en letras.',
    hora: 'Elija la hora: se pone en letras.',
    texto: 'Escriba el dato tal como debe quedar.',
  };
  let campo = null, kind = 'texto', pair = null;

  // El dato va en mayúsculas si el texto que lo antecede lo está (p. ej. «ESCRITURA PÚBLICA NÚMERO»).
  function upperAround(el) {
    const r = document.createRange();
    r.selectNodeContents(el.closest('p'));
    r.setEndBefore(el);
    const letters = r.toString().replace(/[^\p{L}]/gu, '').slice(-12);
    return letters.length > 2 && letters === up(letters);
  }

  function output() {
    const t = fieldText(kind, input.value);
    return kind !== 'texto' && upperAround(campo) ? up(t) : t;
  }

  function refresh() {
    const t = output();
    $('#campo-out').textContent = t;
    dc.querySelector('button[value=ok]').disabled = !t;
  }

  function openCampo(el) {
    campo = el;
    const label = el.textContent.slice(1, -1);
    kind = fieldKind(label);
    // [PRECIO EN LETRAS] llena también el [PRECIO EN CIFRAS] que le sigue.
    const twin = kind === 'letras' && `[${label.replace(/ EN LETRAS$/, '')} EN CIFRAS]`;
    pair = twin && [...$('#pages').querySelectorAll('.campo')].find((c) => c.textContent === twin && el.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING);
    $('#campo-title').textContent = label;
    const opts = kind === 'texto' && label.includes(' / ') ? label.split(' / ') : [];
    $('#campo-hint').textContent = (opts.length ? 'Elija una opción o escriba el dato.' : HINTS[kind]) + (pair ? ` También se llena ${twin}.` : '');
    $('#campo-opts').innerHTML = '';
    for (const o of opts) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn small';
      b.textContent = o;
      b.onclick = () => { input.value = o; refresh(); input.focus(); };
      $('#campo-opts').append(b);
    }
    input.type = kind === 'fecha' ? 'date' : kind === 'hora' ? 'time' : 'text';
    input.inputMode = ['letras', 'numero', 'porcentaje'].includes(kind) ? 'decimal' : 'text';
    input.placeholder = kind === 'codigo' ? '001-010190-0001A' : '';
    input.value = '';
    refresh();
    dc.returnValue = '';
    dc.showModal();
    input.focus();
  }

  input.addEventListener('input', refresh);
  dc.addEventListener('close', () => {
    const el = campo, twin = pair;
    let t = dc.returnValue === 'ok' && el?.isConnected ? output() : '';
    campo = pair = null;
    if (!t) return;
    const figure = input.value.trim();
    Editor.edit(() => {
      // «a las [HORA EN LETRAS]»: el artículo ya está en el texto («a la una» si es la una).
      const prev = el.previousSibling;
      if (kind === 'hora' && prev?.nodeType === 3 && /\blas? $/i.test(prev.data)) {
        const [, art, rest] = /^(\S+) (.*)$/.exec(t);
        prev.data = prev.data.replace(/las? $/i, (m) => (m[0] === 'L' ? up(art) : art) + ' ');
        t = rest;
      }
      const node = document.createTextNode(t);
      el.replaceWith(node);
      if (twin?.isConnected) twin.replaceWith(figure);
      return node;
    });
  });

  $('#pages').addEventListener('click', (e) => {
    const c = e.target.closest?.('.campo');
    if (c && getSelection().isCollapsed && /^\[[^\]]*\]$/.test(c.textContent)) openCampo(c);
  });
})(this);
