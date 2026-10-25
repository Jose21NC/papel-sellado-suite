// Mis datos: perfil del abogado o notario (settings 'profile') para llenar las plantillas, y la bienvenida de la primera vez.
const Profile = (() => {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // [clave, etiqueta, tipo o lista de opciones, ejemplo, ¿se pide en la bienvenida?]
  const FIELDS = [
    ['nombre', 'Nombre completo', 'text', 'Como aparece en su cédula', true],
    ['titulo', 'Profesión o título', ['Abogado y Notario Público', 'Abogada y Notaria Pública', 'Abogado', 'Abogada'], '', true],
    ['notario', '¿Es notario autorizado para cartular?', [['si', 'Sí'], ['no', 'No']], '', true],
    ['cedula', 'Cédula de identidad', 'text', '001-010190-0001A', true],
    ['carnet', 'Número de carné de la Corte Suprema de Justicia', 'text', '', true],
    ['domicilio', 'Domicilio y residencia (ciudad)', 'text', 'Managua', true],
    ['quinquenio', 'Vence su quinquenio para cartular', 'date', '', true],
    ['ciudad', 'Ciudad habitual de otorgamiento', 'text', 'Managua', true],
    ['estadoCivil', 'Estado civil', 'text', 'casado, soltero…'],
    ['oficio', 'Profesión u oficio (si es distinto)', 'text', ''],
    ['oficina', 'Dirección de la oficina', 'text', ''],
    ['telefono', 'Teléfono', 'tel', ''],
    ['correo', 'Correo', 'email', ''],
    ['protocolo', 'Número de su protocolo', 'number', ''],
    ['protocoloAnio', 'Año del protocolo', 'number', String(new Date().getFullYear())],
  ];
  // Solo texto plano: el respaldo importado viene de un archivo.
  const clean = (o) => ({ id: 'profile', ...Object.fromEntries(FIELDS.map(([k]) => [k, typeof o?.[k] === 'string' ? o[k].trim().slice(0, 200) : ''])) });
  let profile = clean({});

  function say(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.hidden = false;
    setTimeout(() => { t.hidden = true; }, 3000);
  }

  function render(box, welcomeOnly) {
    box.innerHTML = FIELDS.filter((f) => !welcomeOnly || f[4]).map(([k, label, type, hint]) => {
      const v = esc(profile[k]);
      const input = Array.isArray(type)
        ? `<select name="${k}"><option value="">—</option>${type.map((o) => { const [val, txt] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(val)}"${profile[k] === val ? ' selected' : ''}>${esc(txt)}</option>`; }).join('')}</select>`
        : `<input type="${type}" name="${k}" value="${v}" maxlength="200" placeholder="${esc(hint)}">`;
      return `<label>${esc(label)} ${input}</label>`;
    }).join('');
  }

  // Lee los campos mostrados; los demás conservan su valor.
  const read = (box) => clean({ ...profile, ...Object.fromEntries([...box.querySelectorAll('[name]')].map((el) => [el.name, el.value])) });

  async function save(o) {
    profile = clean(o);
    await DB.put('settings', profile);
  }

  function open() {
    const d = $('#dlg-profile');
    render($('#profile-fields'));
    d.returnValue = '';
    d.showModal();
    d.addEventListener('close', async () => {
      if (d.returnValue !== 'ok') return;
      await save(read($('#profile-fields')));
      say('Datos guardados');
    }, { once: true });
  }

  function welcome() {
    const d = $('#dlg-welcome');
    const box = $('#welcome-fields');
    let step = 1;
    render(box, true);
    const show = () => {
      for (const s of d.querySelectorAll('[data-step]')) s.hidden = Number(s.dataset.step) !== step;
      $('#welcome-back').hidden = step === 1;
      $('#welcome-skip').hidden = step === 4;
      $('#welcome-next').textContent = step === 4 ? 'Empezar' : 'Siguiente';
      d.querySelectorAll('.steps-dots span').forEach((s, i) => s.classList.toggle('on', i === step - 1));
      d.querySelector(`[data-step="${step}"] h2`).focus();
    };
    $('#welcome-next').onclick = async () => {
      if (step === 4) { d.close('done'); return; }
      if (step === 3) {
        const v = read(box);
        if (JSON.stringify(v) !== JSON.stringify(profile)) { await save(v); say('Datos guardados'); }
      }
      step++;
      show();
    };
    $('#welcome-back').onclick = () => { step--; show(); };
    // Enter en un dato es «Siguiente»: si no, enviaría el formulario con «Omitir» y se perdería lo escrito.
    box.onkeydown = (e) => { if (e.key === 'Enter' && e.target.matches('input')) { e.preventDefault(); $('#welcome-next').click(); } };
    d.returnValue = '';
    d.showModal();
    show();
    // Se muestra una sola vez, aunque la omita o la cierre con Esc.
    d.addEventListener('close', () => DB.put('settings', { id: 'welcome', at: new Date().toISOString() }).catch(() => {}), { once: true });
  }

  $('#btn-profile').addEventListener('click', open);
  $('#btn-welcome-again').addEventListener('click', async () => {
    const d = $('#dlg-profile');
    await save(read($('#profile-fields')));
    d.close();
    welcome();
  });

  async function init() {
    // Los avisos dicen dónde quedan los datos: en la cuenta o solo en este navegador.
    for (const el of document.querySelectorAll('[data-con-cuenta], [data-sin-cuenta]')) el.hidden = el.hasAttribute('data-con-cuenta') !== !!Cloud.user();
    const [p, seen] = await Promise.all([DB.get('settings', 'profile'), DB.get('settings', 'welcome')]);
    if (p) profile = clean(p);
    if (!seen) welcome();
  }

  // filled: hay algún dato (un respaldo con el perfil vacío no debe borrar el de otra computadora).
  return { init, save, get: () => ({ ...profile }), filled: () => FIELDS.some(([k]) => profile[k]) };
})();
