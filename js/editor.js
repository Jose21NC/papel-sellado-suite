// Editor sobre el papel: cada cara del papel sellado es un área editable con sus 30 renglones.
// El texto fluye solo de una cara a la siguiente (frente → reverso → siguiente hoja) y la vista
// en pantalla es exactamente lo que se imprime, porque se imprime el mismo DOM en puntos (pt).
const Editor = (() => {
  const SCREEN_SCALE = 2;
  const PRINT_SCALE = 300 / 72;
  let root, work, ctx;
  let eds = [];
  let undoStack = [], redoStack = [], lastSnapAt = 0, lastGroup = '';
  let pendingFrom = Infinity, rafId = 0, composing = false, dashTimer = 0;
  const baselineCache = new Map();

  // ---------- geometría ----------
  const paperFor = (i) => { const id = work.paperIds[Math.floor(i / 2)]; return id ? ctx.paper(id) : null; };
  const geometryFor = (i) => paperFor(i)?.pages[i % 2]?.geometry || PS_PARSE.DEFAULT_GEOMETRY;
  const sideFor = (i) => paperFor(i)?.pages[i % 2]?.side || (i % 2 ? 'reverso' : 'frente');

  // Distancia (pt) del borde superior de la línea a la línea base, medida por el propio navegador.
  function baselineOffset(font, size, lh) {
    const key = `${font}|${size}|${lh}`;
    if (!baselineCache.has(key)) {
      const d = document.createElement('div');
      d.style.cssText = `position:absolute;left:-9999px;top:0;visibility:hidden;white-space:nowrap;font-family:${font};font-size:${size}pt;line-height:${lh}pt`;
      d.innerHTML = 'Hg<span style="display:inline-block;width:0;height:0;vertical-align:baseline"></span>';
      document.body.append(d);
      const px = d.lastChild.getBoundingClientRect().top - d.getBoundingClientRect().top;
      d.remove();
      baselineCache.set(key, px * 0.75);
    }
    return baselineCache.get(key);
  }

  // ---------- construcción de páginas ----------
  function addPage() {
    const i = eds.length;
    if (i % 2 === 0) {
      const bar = document.createElement('div');
      bar.className = 'sheet-bar';
      root.append(bar);
    }
    const page = document.createElement('div');
    page.className = 'page';
    page.innerHTML = '<div class="bg"></div><div class="area"><div class="seal"></div>' +
      '<div class="ed" contenteditable="true" spellcheck="true" lang="es"></div></div><div class="dashes"></div>';
    root.append(page);
    eds.push(page.querySelector('.ed'));
    layoutPage(i);
    return eds[i];
  }

  function removeLastPage() {
    const page = eds.pop().closest('.page');
    if (eds.length % 2 === 0) page.previousElementSibling.remove(); // barra de la hoja
    page.remove();
  }

  function setPageCount(n) {
    while (eds.length < n) addPage();
    while (eds.length > n) removeLastPage();
  }

  function layoutPage(i) {
    const page = eds[i].closest('.page');
    const g = geometryFor(i);
    const s = work.settings;
    const L = g.lineHeight;
    const left = g.left + 4 + s.marginLeft;
    const right = g.right - 4 - s.marginRight;
    const area = page.querySelector('.area');
    Object.assign(area.style, {
      left: left + 'pt', width: (right - left) + 'pt', height: g.lines * L + 'pt',
      top: (g.firstRule - s.gap - baselineOffset(s.font, s.size, L)) + 'pt',
    });
    page.style.setProperty('--lh', L + 'pt');
    page.style.width = g.width + 'pt';
    page.style.height = g.height + 'pt';
    eds[i].dataset.lines = g.lines;
    const seal = page.querySelector('.seal');
    const sealW = sideFor(i) === 'frente' ? g.sealRight + 4 - left : 0;
    seal.style.width = Math.max(0, sealW) + 'pt';
    seal.style.height = sealW > 0 ? g.sealLines * L + 'pt' : '0';

    const paper = paperFor(i);
    const bg = page.querySelector('.bg');
    page.classList.toggle('virtual', !paper?.pages[i % 2]);
    page.dataset.paper = paper ? paper.id : '';
    if (paper && paper.pages[i % 2]) {
      if (bg.dataset.key !== paper.id + i % 2) {
        bg.dataset.key = paper.id + i % 2;
        bg.innerHTML = '<img alt="">';
        ctx.image(paper, i % 2, SCREEN_SCALE).then((url) => {
          if (bg.dataset.key === paper.id + i % 2 && !bg.firstChild.src) bg.firstChild.src = url;
        }).catch(() => ctx.status('No se pudo dibujar el papel sellado'));
      }
    } else {
      bg.dataset.key = '';
      bg.innerHTML = Array.from({ length: g.lines }, (_, k) =>
        `<div class="rule" style="top:${g.firstRule + k * L}pt;left:${g.left}pt;width:${g.right - g.left}pt"><span>${k + 1}</span></div>`).join('');
    }
    if (i % 2 === 0) renderSheetBar(i / 2);
  }

  function renderSheetBar(sheet) {
    const bar = eds[sheet * 2].closest('.page').previousElementSibling;
    const paper = paperFor(sheet * 2);
    bar.innerHTML = '';
    const label = document.createElement('span');
    label.textContent = `Hoja ${sheet + 1} · ` + (paper
      ? `${cap(paper.type)} C$${paper.value ?? '?'} · Serie ${paper.serie || '—'} Nº ${paper.numero || '—'}`
      : 'Sin papel sellado asignado (borrador)');
    bar.append(label);
    for (const [action, text] of paper ? [['change', 'Cambiar'], ['remove', 'Quitar']] : [['change', 'Asignar papel']]) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn small';
      b.textContent = text;
      b.onclick = () => ctx.sheetAction(sheet, action);
      bar.append(b);
    }
  }

  const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : '');

  // ---------- normalización ----------
  const BLOCKS = /^(DIV|H[1-6]|LI|BLOCKQUOTE|PRE|SECTION|ARTICLE|UL|OL|TABLE|TR|TD)$/;

  function normalize(ed) {
    let wrap = null;
    for (const node of [...ed.childNodes]) {
      if (node.nodeName === 'P') { wrap = null; continue; }
      if (node.nodeType === 1 && BLOCKS.test(node.nodeName)) {
        const p = document.createElement('p');
        const align = node.style.textAlign || node.getAttribute('align');
        if (align) p.style.textAlign = align;
        while (node.firstChild) p.append(node.firstChild);
        node.replaceWith(p);
        wrap = null;
        continue;
      }
      if (node.nodeName === 'BR' && !wrap) { node.remove(); continue; }
      if (!wrap) { wrap = document.createElement('p'); node.before(wrap); }
      wrap.append(node);
    }
    // Firefox alinea con el atributo align: se pasa a style para que lo respeten el CSS y los guiones.
    for (const el of ed.querySelectorAll('[align]')) { if (el.nodeName === 'P') el.style.textAlign = el.getAttribute('align'); el.removeAttribute('align'); }
    for (const el of ed.querySelectorAll('[style]')) {
      // El tamaño y la interlínea son únicos para todo el documento: así cada línea cae sobre su renglón.
      if (el.nodeName === 'P') { const a = el.style.textAlign; el.removeAttribute('style'); if (a) el.style.textAlign = a; }
      else el.removeAttribute('style');
    }
    for (const el of ed.querySelectorAll('font, span:not([class])')) el.replaceWith(...el.childNodes);
    // Un campo de plantilla [ASÍ] deja de resaltarse en cuanto se escribe el dato.
    for (const el of ed.querySelectorAll('span.campo')) if (!/^\[[^\]]*\]$/.test(el.textContent)) el.replaceWith(...el.childNodes);
    const ps = ed.children;
    for (let k = 0; k < ps.length; k++) {
      const p = ps[k];
      if (k > 0) p.removeAttribute('data-cont');
      if (k < ps.length - 1) p.removeAttribute('data-split');
      if (!p.textContent && !p.querySelector('br')) p.append(document.createElement('br'));
    }
  }

  // Une el último párrafo de `a` con el primero de `b` cuando son el mismo párrafo partido entre páginas.
  function joinSplit(lastP, firstP) {
    if (!lastP || !firstP || !lastP.hasAttribute('data-split') || !firstP.hasAttribute('data-cont')) return false;
    if (lastP.lastChild?.nodeName === 'BR') lastP.lastChild.remove();
    while (firstP.firstChild) lastP.append(firstP.firstChild);
    firstP.remove();
    // Si la parte unida también seguía en otra página (párrafo de 3+ páginas), el párrafo sigue partido.
    if (!firstP.hasAttribute('data-split')) lastP.removeAttribute('data-split');
    return true;
  }

  function pullAll(from, into) {
    joinSplit(into.lastElementChild, from.firstElementChild);
    while (from.firstChild) into.append(from.firstChild);
  }

  // Sube solo el primer párrafo de `from` (o su parte, si continúa el último de `into`).
  function pullFirst(from, into) {
    if (!joinSplit(into.lastElementChild, from.firstElementChild)) into.append(from.firstChild);
  }

  function prepend(ed, frag) {
    joinSplit(frag.lastElementChild, ed.firstElementChild);
    ed.insertBefore(frag, ed.firstChild);
  }

  // ---------- paginación ----------
  function findLineStart(p, limit) {
    const range = document.createRange();
    const topOf = (node, k) => {
      range.setStart(node, k);
      range.setEnd(node, k + 1);
      for (const r of range.getClientRects()) if (r.height > 0) return r.top;
      return -Infinity; // espacio colapsado: pertenece a la línea anterior
    };
    const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const len = node.data.length;
      if (!len || topOf(node, len - 1) < limit) continue;
      let lo = 0, hi = len - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (topOf(node, mid) >= limit) hi = mid; else lo = mid + 1;
      }
      return { node, offset: lo };
    }
    return null;
  }

  // Corta lo que no cabe en los renglones de la página y lo devuelve como fragmento.
  function splitOverflow(ed) {
    const lines = Number(ed.dataset.lines);
    const box = ed.parentNode.getBoundingClientRect();
    const lineH = box.height / lines;
    const limit = box.bottom - lineH / 2;
    const ps = [...ed.children];
    for (let k = 0; k < ps.length; k++) {
      const p = ps[k];
      const r = p.getBoundingClientRect();
      if (r.bottom <= box.bottom + 1) continue;
      const range = document.createRange();
      let inside = false;
      const firma = p.classList.contains('firma');
      if (r.top >= limit || firma) {
        // Un bloque de firmas no se parte: pasa entero a la página siguiente (salvo que no quepa ni en una página vacía).
        let k0 = k;
        if (firma) while (k0 > 0 && ps[k0 - 1].classList.contains('firma')) k0--;
        if (k0 === 0) k0 = k;
        if (k0 === 0) return null; // ni el primer renglón cabe: no se puede partir
        range.setStartBefore(ps[k0]);
      } else {
        const start = findLineStart(p, limit);
        if (!start) continue;
        range.setStart(start.node, start.offset);
        inside = true;
      }
      range.setEnd(ed, ed.childNodes.length);
      const frag = range.extractContents();
      if (inside) {
        p.setAttribute('data-split', '');
        frag.firstChild.setAttribute('data-cont', ''); // conserva data-split si el párrafo sigue más allá
      }
      return frag;
    }
    return null;
  }

  // full: revisar todas las páginas (cambió la geometría). Si no, se detiene cuando una página queda igual
  // después de la editada: las siguientes ya no cambian.
  function paginate(from, full) {
    let last = from;
    for (let i = from; i < eds.length; i++) {
      last = i;
      normalize(eds[i]);
      const before = eds[i].textContent;
      let frag = splitOverflow(eds[i]);
      const grew = !!frag;
      // Si sobra espacio, sube párrafos de las páginas siguientes uno por uno hasta llenarla.
      for (let j = i + 1; !frag && j < eds.length;) {
        if (!eds[j].firstChild) { j++; continue; }
        pullFirst(eds[j], eds[i]);
        normalize(eds[i]);
        frag = splitOverflow(eds[i]);
      }
      if (frag) {
        if (i + 1 >= eds.length) addPage();
        prepend(eds[i + 1], frag);
      }
      const rest = eds.slice(i + 1).some((e) => e.firstChild);
      if (!rest) break;
      if (!full && !grew && i >= from + 2 && eds[i].textContent === before) break;
    }
    // Quita páginas de borrador vacías al final (las caras de un papel asignado se conservan).
    const keep = Math.max(1, work.paperIds.length * 2);
    while (eds.length > keep && !eds[eds.length - 1].firstChild) removeLastPage();
    if (!eds[0].firstChild) eds[0].innerHTML = '<p><br></p>';
    // Un corte entre páginas solo es válido si ambos lados lo marcan.
    for (let i = 0; i < eds.length; i++) {
      const last = eds[i].lastElementChild, next = eds[i + 1]?.firstElementChild;
      const ok = last?.hasAttribute('data-split') && next?.hasAttribute('data-cont');
      if (!ok) { last?.removeAttribute('data-split'); next?.removeAttribute('data-cont'); }
    }
    return last + 1; // última página que pudo cambiar
  }

  // ---------- selección (marcadores que viajan con el texto) ----------
  function mark(cls) { const s = document.createElement('span'); s.className = cls; return s; }

  function placeMarker(m, range) {
    range.insertNode(m);
    if (m.parentNode.classList?.contains('ed')) {
      const p = m.nextElementSibling || m.previousElementSibling;
      if (p) { if (p === m.nextElementSibling) p.prepend(m); else p.append(m); }
    }
  }

  function saveSelection() {
    const sel = getSelection();
    if (!sel.rangeCount) return false;
    const r = sel.getRangeAt(0);
    const host = (n) => (n.nodeType === 1 ? n : n.parentNode)?.closest('.ed');
    if (!root.contains(r.commonAncestorContainer) || !host(r.startContainer)) return false;
    if (!r.collapsed) { const e = r.cloneRange(); e.collapse(false); placeMarker(mark('mk-e'), e); }
    const s = r.cloneRange(); s.collapse(true); placeMarker(mark('mk-s'), s);
    return true;
  }

  function restoreSelection(scroll) {
    const s = root.querySelector('.mk-s');
    const e = root.querySelector('.mk-e');
    if (!s) { e?.remove(); return; }
    const ed = s.closest('.ed');
    const range = document.createRange();
    range.setStartBefore(s);
    if (e && e.closest('.ed') === ed) range.setEndBefore(e); else range.collapse(true);
    s.remove(); e?.remove();
    if (document.activeElement !== ed) ed.focus({ preventScroll: true });
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    if (scroll) reveal();
  }

  // Desplaza la vista solo si el cursor quedó fuera de la pantalla (p. ej. pasó a la página siguiente).
  function reveal() {
    const sel = getSelection();
    if (!sel.rangeCount) return;
    let r = sel.getRangeAt(0).getClientRects()[0];
    if (!r) { const n = sel.anchorNode; r = (n.nodeType === 1 ? n : n.parentNode).getBoundingClientRect(); }
    const toolbar = document.querySelector('.toolbar')?.getBoundingClientRect().bottom || 0;
    if (r.top < toolbar + 10 || r.bottom > innerHeight - 30) window.scrollBy(0, r.top - (toolbar + innerHeight) / 2);
  }

  function reflow(from = 0, scroll = true, full = false) {
    const had = saveSelection();
    const start = Math.max(0, from);
    const end = paginate(start, full);
    if (had) restoreSelection(scroll);
    if (full) scheduleDashes(0, eds.length); else scheduleDashes(start, end + 1);
    ctx.changed();
  }

  function schedule(from) {
    pendingFrom = Math.min(pendingFrom, from);
    if (rafId || composing) return;
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      const f = pendingFrom;
      pendingFrom = Infinity;
      reflow(f);
    });
  }

  // ---------- guiones de cierre de renglón ----------
  const dirty = new Set();
  function scheduleDashes(a, b) {
    for (let i = a; i < Math.min(b, eds.length); i++) dirty.add(eds[i]);
    clearTimeout(dashTimer);
    dashTimer = setTimeout(drawDashes, 250);
  }

  // Primero se miden todas las páginas y después se escribe, para no forzar el diseño en cada guion.
  function drawDashes(all) {
    clearTimeout(dashTimer);
    const targets = all === true ? eds.slice() : eds.filter((ed) => dirty.has(ed));
    dirty.clear();
    const plans = targets.map((ed) => [ed, work.settings.dashes ? measureDashes(ed) : []]);
    for (const [ed, list] of plans) {
      ed.closest('.page').querySelector('.dashes').replaceChildren(...list.map(([left, top, width]) => {
        const d = document.createElement('div');
        d.className = 'dash';
        d.style.cssText = `left:${left}pt;top:${top}pt;width:${width}pt`;
        d.textContent = '-'.repeat(160);
        return d;
      }));
    }
  }

  function measureDashes(ed) {
    const out = [];
    const range = document.createRange();
    const page = ed.closest('.page');
    const pr = page.getBoundingClientRect();
    const k = pr.width / parseFloat(page.style.width); // px de pantalla por pt
    const area = ed.parentNode.getBoundingClientRect();
    const lineH = area.height / Number(ed.dataset.lines);
    const sealRight = ed.previousElementSibling.getBoundingClientRect().right;
    const add = (x0, x1, top) => { if (x1 - x0 >= 6 * k) out.push([(x0 - pr.left) / k, (top - pr.top) / k, (x1 - x0) / k]); };
    for (const p of ed.children) {
      if (p.hasAttribute('data-split') || p.classList.contains('firma')) continue; // la línea de firma queda en blanco
      const pRect = p.getBoundingClientRect();
      if (pRect.bottom > area.bottom + 1) break; // lo que no cabe se mueve a la página siguiente
      const lineTop = pRect.bottom - lineH;
      range.selectNodeContents(p);
      const rects = [...range.getClientRects()].filter((r) => r.width > 0 && r.top + r.height / 2 > lineTop);
      const minX = lineTop < area.top + lineH * 3 ? Math.max(area.left, sealRight) : area.left;
      if (!rects.length) { add(minX, area.right, lineTop); continue; }
      const textL = Math.min(...rects.map((r) => r.left)), textR = Math.max(...rects.map((r) => r.right));
      const align = p.style.textAlign;
      if (align === 'right' || align === 'center') add(minX, textL - 2 * k, lineTop);
      if (align !== 'right') add(textR + 2 * k, area.right, lineTop);
    }
    return out;
  }

  // ---------- deshacer / rehacer ----------
  function currentHtml() {
    const had = saveSelection();
    const html = eds.map((e) => e.innerHTML);
    if (had) restoreSelection(false);
    return html;
  }

  function snapshot() {
    undoStack.push(currentHtml());
    if (undoStack.length > 200) undoStack.shift();
    redoStack = [];
    lastSnapAt = Date.now();
  }

  function applyHtml(html) {
    setPageCount(Math.max(html.length, work.paperIds.length * 2));
    html.forEach((h, i) => { eds[i].innerHTML = h; });
    restoreSelection(true);
    reflow(0, true, true);
  }

  function undo() { if (undoStack.length) { redoStack.push(currentHtml()); applyHtml(undoStack.pop()); lastGroup = ''; } }
  function redo() { if (redoStack.length) { undoStack.push(currentHtml()); applyHtml(redoStack.pop()); lastGroup = ''; } }

  // ---------- pegar ----------
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const SKIP = /^(SCRIPT|STYLE|HEAD|TITLE|META|LINK|XML|TEMPLATE|IFRAME|OBJECT|SVG|IMG|BUTTON|INPUT|SELECT|TEXTAREA)$/;
  const BLOCK_SRC = /^(P|DIV|H[1-6]|LI|BLOCKQUOTE|PRE|TR|SECTION|ARTICLE|HEADER|FOOTER|UL|OL|TABLE|DT|DD)$/;

  // Convierte HTML externo (Word, web) en párrafos con negrita, cursiva, subrayado y alineación. Nada más pasa.
  function sanitize(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const paras = [];
    let cur = null;
    const open = (align) => { if (!cur) { cur = { align, html: '' }; paras.push(cur); } };
    const close = () => { cur = null; };
    const walk = (node, fmt, align) => {
      if (node.nodeType === 3) {
        const t = node.data.replace(/\s+/g, ' ');
        if (!t.trim() && !cur) return;
        open(align);
        let h = esc(cur.html ? t : t.replace(/^ /, ''));
        if (fmt.u) h = `<u>${h}</u>`;
        if (fmt.i) h = `<i>${h}</i>`;
        if (fmt.b) h = `<b>${h}</b>`;
        cur.html += h;
        return;
      }
      if (node.nodeType !== 1 || SKIP.test(node.nodeName)) return;
      const tag = node.nodeName;
      if (tag === 'BR') { if (!cur) open(align); close(); return; }
      const st = node.style || {};
      const f = {
        // Un estilo explícito manda (Google Docs envuelve todo en <b style="font-weight:normal">).
        b: st.fontWeight ? /^(bold|bolder|[6-9]00)$/.test(st.fontWeight) : fmt.b || tag === 'B' || tag === 'STRONG',
        i: st.fontStyle ? st.fontStyle === 'italic' : fmt.i || tag === 'I' || tag === 'EM',
        u: fmt.u || tag === 'U' || /underline/.test(st.textDecoration || ''),
      };
      const block = BLOCK_SRC.test(tag);
      const a = block ? (st.textAlign || node.getAttribute('align') || '').toLowerCase() : align;
      if (block) close();
      if (tag === 'TD' || tag === 'TH') { if (cur) cur.html += ' '; }
      for (const c of node.childNodes) walk(c, f, a);
      if (block) close();
    };
    walk(doc.body, {}, '');
    return paras.map((p) => {
      const align = ['left', 'center', 'right', 'justify'].includes(p.align) ? ` style="text-align:${p.align}"` : '';
      return `<p${align}>${p.html.replace(/ $/, '') || '<br>'}</p>`;
    }).join('');
  }

  const textToHtml = (t) => t.replace(/\r\n?/g, '\n').split('\n').map((l) => `<p>${esc(l) || '<br>'}</p>`).join('');

  // ---------- teclado entre páginas ----------
  function caretAt(ed, where) {
    const r = document.createRange();
    r.selectNodeContents(ed);
    r.collapse(where === 'start');
    // Dentro del primer texto: un cursor en el borde de un elemento no tiene posición en pantalla.
    if (where === 'start' && ed.firstElementChild) {
      const t = document.createTreeWalker(ed.firstElementChild, NodeFilter.SHOW_TEXT).nextNode();
      if (t) r.setStart(t, 0); else r.selectNodeContents(ed.firstElementChild);
      r.collapse(true);
    }
    if (where === 'end') {
      const last = ed.lastElementChild;
      if (last) { r.selectNodeContents(last); r.collapse(false); if (last.lastChild?.nodeName === 'BR') r.setStartBefore(last.lastChild); }
    }
    ed.focus({ preventScroll: true });
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
    reveal();
  }

  function atEdge(ed, where) {
    const sel = getSelection();
    if (!sel.rangeCount || !sel.isCollapsed) return false;
    const r = sel.getRangeAt(0);
    const probe = document.createRange();
    probe.selectNodeContents(ed);
    if (where === 'start') probe.setEnd(r.startContainer, r.startOffset);
    else probe.setStart(r.startContainer, r.startOffset);
    const p = (r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentNode).closest('p');
    const blockOk = where === 'start' ? p === ed.firstElementChild || !p : p === ed.lastElementChild || !p;
    return blockOk && probe.toString() === '';
  }

  function caretLine(ed) {
    const r = getSelection().getRangeAt(0);
    let rect = r.getClientRects()[0];
    if (!rect) rect = (r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentNode).getBoundingClientRect();
    const area = ed.parentNode.getBoundingClientRect();
    const lineH = area.height / Number(ed.dataset.lines);
    return { x: rect.left, first: rect.top < area.top + lineH * 0.9, last: rect.bottom > ed.getBoundingClientRect().bottom - lineH * 0.9 };
  }

  function caretFromPoint(x, y) {
    if (document.caretRangeFromPoint) return document.caretRangeFromPoint(x, y);
    const p = document.caretPositionFromPoint?.(x, y);
    if (!p) return null;
    const r = document.createRange();
    r.setStart(p.offsetNode, p.offset);
    return r;
  }

  function onKeyDown(e) {
    const ed = e.target.closest?.('.ed');
    if (!ed) return;
    const i = eds.indexOf(ed);
    const mod = e.metaKey || e.ctrlKey;
    if (mod && !e.altKey && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if (mod && !e.altKey && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
    if (e.key === 'Tab' && !mod) { e.preventDefault(); return; } // la sangría es un ajuste; Tab no salta de página
    // Ctrl+A selecciona el documento completo (para copiar); editar sigue siendo por página.
    if (mod && !e.altKey && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      const r = document.createRange();
      r.setStart(eds[0], 0);
      r.setEnd(eds[eds.length - 1], eds[eds.length - 1].childNodes.length);
      getSelection().removeAllRanges();
      getSelection().addRange(r);
      return;
    }
    if (spansPages() && (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Enter') && !mod) {
      e.preventDefault();
      ctx.status('La selección abarca varias páginas: solo se puede copiar. Haga clic en el texto para seguir escribiendo.');
      return;
    }
    if (mod && ['b', 'i', 'u'].includes(e.key.toLowerCase())) { e.preventDefault(); format({ b: 'bold', i: 'italic', u: 'underline' }[e.key.toLowerCase()]); return; }
    if (e.key === 'Backspace' && i > 0 && atEdge(ed, 'start')) {
      e.preventDefault();
      snapshot();
      saveSelection();
      pullAll(ed, eds[i - 1]);
      restoreSelection(false);
      document.execCommand('delete');
      reflow(i - 1);
    } else if (e.key === 'Delete' && i < eds.length - 1 && atEdge(ed, 'end')) {
      e.preventDefault();
      snapshot();
      saveSelection();
      pullAll(eds[i + 1], ed);
      restoreSelection(false);
      document.execCommand('forwardDelete');
      reflow(i);
    } else if (e.key === 'ArrowLeft' && i > 0 && atEdge(ed, 'start')) {
      e.preventDefault(); caretAt(eds[i - 1], 'end');
    } else if (e.key === 'ArrowRight' && i < eds.length - 1 && atEdge(ed, 'end')) {
      e.preventDefault(); caretAt(eds[i + 1], 'start');
    } else if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && getSelection().rangeCount && !e.shiftKey) {
      const target = eds[i + (e.key === 'ArrowUp' ? -1 : 1)];
      if (!target || !target.firstChild) return;
      const pos = caretLine(ed);
      if (e.key === 'ArrowUp' ? !pos.first : !pos.last) return;
      e.preventDefault();
      const tr = target.getBoundingClientRect();
      const lastP = target.lastElementChild.getBoundingClientRect();
      const y = e.key === 'ArrowUp' ? lastP.bottom - 4 : target.getBoundingClientRect().top + 4;
      const r = caretFromPoint(Math.min(Math.max(pos.x, tr.left + 1), tr.right - 1), y);
      if (r && target.contains(r.startContainer)) {
        target.focus({ preventScroll: true });
        getSelection().removeAllRanges();
        getSelection().addRange(r);
        reveal();
      } else caretAt(target, e.key === 'ArrowUp' ? 'end' : 'start');
    }
  }

  function onBeforeInput(e) {
    if (!e.target.closest?.('.ed')) return;
    if (spansPages()) { e.preventDefault(); return; }
    if (e.inputType === 'historyUndo') { e.preventDefault(); undo(); return; }
    if (e.inputType === 'historyRedo') { e.preventDefault(); redo(); return; }
    if (e.inputType === 'insertLineBreak') { e.preventDefault(); snapshot(); document.execCommand('insertParagraph'); return; }
    const group = e.inputType.startsWith('insertText') ? 'text' : e.inputType.startsWith('delete') ? 'del' : e.inputType;
    if (group !== lastGroup || Date.now() - lastSnapAt > 1500 || (group !== 'text' && group !== 'del')) snapshot();
    lastGroup = group;
  }

  function insertClean(data) {
    const html = data.getData('text/html');
    const text = data.getData('text/plain');
    if (!html && !text) return; // imagen o archivo: nada que pegar
    const clean = html ? sanitize(html) : textToHtml(text);
    if (!clean) return;
    snapshot();
    lastGroup = '';
    document.execCommand('insertHTML', false, clean);
  }

  function onPaste(e) {
    if (!e.target.closest?.('.ed')) return;
    e.preventDefault();
    if (!spansPages()) insertClean(e.clipboardData);
  }

  // Copiar una selección de varias páginas: solo el texto (sin barras ni números de renglón) y con los
  // párrafos partidos entre páginas vueltos a unir.
  function onCopy(e) {
    if (!spansPages()) return;
    e.preventDefault();
    const r = getSelection().getRangeAt(0);
    const box = document.createElement('div');
    for (const ed of eds) {
      if (!r.intersectsNode(ed)) continue;
      const sub = document.createRange();
      sub.selectNodeContents(ed);
      if (ed.contains(r.startContainer)) sub.setStart(r.startContainer, r.startOffset);
      if (ed.contains(r.endContainer)) sub.setEnd(r.endContainer, r.endOffset);
      box.append(sub.cloneContents());
    }
    for (const p of [...box.children]) if (p.parentNode === box) while (joinSplit(p, p.nextElementSibling));
    for (const p of box.children) { p.removeAttribute('data-split'); p.removeAttribute('data-cont'); }
    e.clipboardData.setData('text/html', box.innerHTML);
    e.clipboardData.setData('text/plain', [...box.children].map((p) => p.textContent).join('\n'));
  }

  // Soltar texto arrastrado pasa por la misma limpieza que pegar.
  // shortcut: arrastrar dentro del documento copia en vez de mover; usar cortar y pegar para mover.
  function onDrop(e) {
    const ed = e.target.closest?.('.ed');
    if (!ed) return;
    e.preventDefault();
    const r = caretFromPoint(e.clientX, e.clientY);
    if (!r || !ed.contains(r.startContainer)) return;
    ed.focus({ preventScroll: true });
    getSelection().removeAllRanges();
    getSelection().addRange(r);
    insertClean(e.dataTransfer);
  }

  // ---------- comandos de formato ----------
  const hostOf = (n) => (n.nodeType === 1 ? n : n.parentNode)?.closest?.('.ed');
  const spansPages = () => { const s = getSelection(); return s.rangeCount > 0 && !s.isCollapsed && hostOf(s.anchorNode) !== hostOf(s.focusNode); };

  function format(cmd, value) {
    const sel = getSelection();
    if (!sel.rangeCount || !root.contains(sel.anchorNode)) { ctx.status('Primero haga clic en el texto'); return; }
    if (spansPages()) { ctx.status('Para dar formato, seleccione texto dentro de una misma página'); return; }
    snapshot();
    lastGroup = '';
    if (cmd === 'upper' || cmd === 'lower') {
      const r = sel.getRangeAt(0);
      const walker = document.createTreeWalker(r.commonAncestorContainer.nodeType === 3 ? r.commonAncestorContainer.parentNode : r.commonAncestorContainer, NodeFilter.SHOW_TEXT);
      const nodes = [];
      let n;
      while ((n = walker.nextNode())) if (r.intersectsNode(n)) nodes.push(n);
      const { startContainer: sc, startOffset: so, endContainer: ec, endOffset: eo } = r;
      for (const t of nodes) {
        const a = t === sc ? so : 0, b = t === ec ? eo : t.data.length;
        const part = t.data.slice(a, b);
        t.data = t.data.slice(0, a) + (cmd === 'upper' ? part.toLocaleUpperCase('es') : part.toLocaleLowerCase('es')) + t.data.slice(b);
      }
      r.setStart(sc, so); r.setEnd(ec, eo);
      sel.removeAllRanges(); sel.addRange(r);
    } else {
      document.execCommand(cmd, false, value);
      // Un párrafo partido entre páginas son dos <p>: la alineación se copia a la otra mitad.
      if (cmd.startsWith('justify')) {
        const r = sel.getRangeAt(0);
        const host = hostOf(r.startContainer);
        for (const p of host ? host.children : []) {
          if (!r.intersectsNode(p)) continue;
          const i = eds.indexOf(host);
          const other = p.hasAttribute('data-cont') ? eds[i - 1]?.lastElementChild : p.hasAttribute('data-split') ? eds[i + 1]?.firstElementChild : null;
          if (other) other.style.textAlign = p.style.textAlign;
        }
      }
    }
    const ed = sel.anchorNode && hostOf(sel.anchorNode);
    reflow(Math.max(0, eds.indexOf(ed) - 1));
  }

  // ---------- insertar bloques (plantillas, firmas) ----------
  let lastRange = null; // último cursor en el documento: abrir un diálogo le quita la selección
  const inDoc = (n) => !!n && root.contains(n) && !!hostOf(n);
  function trackCaret() {
    const s = getSelection();
    if (s.rangeCount && inDoc(s.anchorNode)) lastRange = s.getRangeAt(0).cloneRange();
  }

  // html: párrafos ya armados y confiables (no pasan por sanitize). Se insertan en el cursor partiendo el
  // párrafo; si el documento está vacío, lo reemplazan. Sin cursor, van al final.
  function insertHtml(html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    const nodes = [...tpl.content.childNodes];
    if (!nodes.length) return;
    snapshot();
    lastGroup = '';
    const sel = getSelection();
    let r = sel.rangeCount && inDoc(sel.anchorNode) ? sel.getRangeAt(0) : lastRange;
    if (r && !inDoc(r.startContainer)) r = null;
    if (r && hostOf(r.startContainer) !== hostOf(r.endContainer)) r.collapse(true); // selección en varias páginas
    let ed;
    if (eds.every((e) => !e.textContent.trim())) {
      eds.forEach((e) => e.replaceChildren());
      ed = eds[0];
      ed.append(tpl.content);
    } else {
      if (!r) { r = document.createRange(); r.selectNodeContents([...eds].reverse().find((e) => e.textContent.trim())); r.collapse(false); }
      ed = hostOf(r.startContainer);
      r.deleteContents();
      const p = (r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentNode).closest('p');
      if (p && ed.contains(p)) {
        const tail = document.createRange();
        tail.setStart(r.startContainer, r.startOffset);
        tail.setEnd(p, p.childNodes.length);
        const after = p.cloneNode(false); // misma alineación; el corte entre páginas sigue con la segunda mitad
        after.removeAttribute('data-cont');
        p.removeAttribute('data-split');
        after.append(tail.extractContents());
        p.after(after);
        after.before(tpl.content);
        if (!after.textContent) after.remove();
        if (!p.textContent) p.remove();
      } else r.insertNode(tpl.content);
    }
    const last = nodes[nodes.length - 1];
    const c = document.createRange();
    c.selectNodeContents(last);
    c.collapse(false);
    ed.focus({ preventScroll: true });
    sel.removeAllRanges();
    sel.addRange(c);
    reflow(Math.max(0, eds.indexOf(ed) - 1));
  }

  // Enter al final de un bloque de firmas: la línea nueva es texto normal (el navegador copia la clase).
  function plainAfterFirma(e) {
    const s = getSelection();
    if (e.inputType !== 'insertParagraph' || !s.rangeCount) return;
    const p = (s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentNode).closest?.('p.firma');
    if (!p || p.textContent || p.nextElementSibling?.classList.contains('firma')) return;
    p.removeAttribute('class');
    p.replaceChildren(document.createElement('br'));
    const r = document.createRange();
    r.setStart(p, 0);
    s.removeAllRanges();
    s.addRange(r);
  }

  // ---------- API ----------
  function mount(el, w, c) {
    root = el; work = w; ctx = c;
    root.innerHTML = '';
    eds = [];
    undoStack = []; redoStack = [];
    document.execCommand('defaultParagraphSeparator', false, 'p');
    document.execCommand('styleWithCSS', false, false);
    applySettings(false);
    const n = Math.max(1, w.pages.length, w.paperIds.length * 2);
    setPageCount(n);
    eds.forEach((ed, i) => { ed.innerHTML = w.pages[i] || ''; });
    if (!eds[0].firstChild) eds[0].innerHTML = '<p><br></p>';
    if (!root.dataset.bound) {
      root.dataset.bound = '1';
      root.addEventListener('keydown', onKeyDown);
      root.addEventListener('beforeinput', onBeforeInput);
      root.addEventListener('paste', onPaste);
      root.addEventListener('drop', onDrop);
      document.addEventListener('copy', onCopy); // con la selección en varias páginas el evento no siempre nace dentro
      root.addEventListener('input', plainAfterFirma);
      document.addEventListener('selectionchange', trackCaret);
      root.addEventListener('input', (e) => { const ed = e.target.closest?.('.ed'); if (ed) schedule(eds.indexOf(ed) - 1); });
      root.addEventListener('compositionstart', () => { composing = true; });
      root.addEventListener('compositionend', (e) => { composing = false; const ed = e.target.closest?.('.ed'); if (ed) schedule(eds.indexOf(ed) - 1); });
      // Hacer clic en una página vacía lleva el cursor al final del texto.
      root.addEventListener('focusin', (e) => {
        const ed = e.target.closest?.('.ed');
        const i = eds.indexOf(ed);
        if (i > 0 && !ed.firstChild) { const last = [...eds].reverse().find((x) => x.firstChild); if (last) setTimeout(() => caretAt(last, 'end')); }
      });
    }
    document.fonts?.ready.then(() => { baselineCache.clear(); relayout(); });
    relayout();
  }

  function applySettings(doRelayout = true) {
    const s = work.settings;
    root.style.setProperty('--font', s.font);
    root.style.setProperty('--size', s.size + 'pt');
    root.style.setProperty('--indent', s.indent + 'pt');
    root.style.setProperty('--ls', s.letterSpacing + 'pt');
    if (doRelayout) relayout();
  }

  // Vuelve a calcular la geometría de todas las páginas (cambio de papel, tipo de letra o márgenes).
  function relayout() {
    setPageCount(Math.max(eds.length, work.paperIds.length * 2));
    eds.forEach((_, i) => layoutPage(i));
    reflow(0, false, true);
  }

  // Prepara la impresión. mode: 'fondo' (con papel sellado) | 'texto' (solo texto).
  async function preparePrint(mode, onProgress) {
    getSelection().removeAllRanges();
    if (mode === 'fondo') {
      // Una página a la vez: cada imagen a 300 ppp ocupa ~40 MB mientras se dibuja.
      for (let i = 0; i < eds.length; i++) {
        const paper = paperFor(i);
        if (!paper || !paper.pages[i % 2]) continue;
        onProgress?.(i + 1, eds.length);
        const img = eds[i].closest('.page').querySelector('.bg img');
        img.src = await ctx.image(paper, i % 2, PRINT_SCALE);
        await img.decode();
      }
    }
    drawDashes(true);
  }

  return {
    mount, relayout, applySettings, format, undo, redo, preparePrint, sanitize, insertHtml,
    pagesHtml: () => eds.map((e) => e.innerHTML),
    pageCount: () => eds.length,
    paperForPage: paperFor,
  };
})();
