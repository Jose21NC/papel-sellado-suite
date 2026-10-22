// Firmas: renglones en blanco para firmar (sin guiones), nombre y calidad; hasta dos firmas por renglón.
// Cada parte es un <p class="firma"> de un renglón; dos firmas van en dos <span class="f2"> (mitades centradas).
(() => {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const up = (s) => s.toLocaleUpperCase('es');
  const clamp = (v, a, b) => Math.min(Math.max(Math.round(Number(v)) || a, a), b);
  const d = $('#dlg-firmas');
  const list = $('#firmas-list');

  function row(i) {
    const f = document.createElement('fieldset');
    f.innerHTML = `<legend>Fila ${i + 1} <label><input type="radio" name="n${i}" value="1" checked> Una firma</label>` +
      `<label><input type="radio" name="n${i}" value="2"> Dos firmas</label></legend>` +
      [0, 1].map((k) => `<label${k ? ' data-second hidden' : ''}>Nombre <input type="text" name="nombre${k}" maxlength="120"></label>` +
        `<label${k ? ' data-second hidden' : ''}>Calidad o cargo <input type="text" name="cargo${k}" maxlength="120" placeholder="Opcional: VENDEDOR, USUFRUCTUARIO…"></label>`).join('');
    f.addEventListener('change', (e) => {
      if (e.target.type === 'radio') for (const el of f.querySelectorAll('[data-second]')) el.hidden = e.target.value !== '2';
    });
    return f;
  }

  function renderRows() {
    const n = clamp($('#firmas-rows').value, 1, 6);
    while (list.children.length < n) list.append(row(list.children.length));
    while (list.children.length > n) list.lastElementChild.remove();
  }

  const line = (parts) => `<p class="firma">${parts.length === 2 ? parts.map((h) => `<span class="f2">${h}</span>`).join('') : parts[0]}</p>`;

  function build() {
    const blank = '<p class="firma"><br></p>'.repeat(clamp($('#firmas-blank').value, 1, 3));
    const rows = [...list.children].map((f) => {
      const two = f.querySelector('input[type=radio]:checked').value === '2';
      return (two ? [0, 1] : [0]).map((k) => ({ nombre: f.querySelector(`[name=nombre${k}]`).value.trim(), cargo: f.querySelector(`[name=cargo${k}]`).value.trim() }));
    });
    if ($('#firmas-notario').checked) {
      const p = Profile.get();
      rows.push([{ nombre: p.nombre, cargo: p.titulo || 'Notario Público', notario: true }]);
    }
    return rows.map((sigs) => blank +
      line(sigs.map((s) => (s.nombre ? esc(up(s.nombre)) : `<span class="campo">[NOMBRE${s.notario ? ' DEL NOTARIO' : ''}]</span>`))) +
      (sigs.some((s) => s.cargo) ? line(sigs.map((s) => esc(up(s.cargo)))) : '')).join('');
  }

  $('#firmas-rows').addEventListener('input', renderRows);
  $('#btn-firmas').addEventListener('click', () => {
    renderRows();
    d.returnValue = '';
    d.showModal();
  });
  d.addEventListener('close', () => { if (d.returnValue === 'ok') Editor.insertHtml(build()); });
})();
