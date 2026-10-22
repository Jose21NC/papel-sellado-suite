// Lectura de un .docx (Word) para importar el protocolo: abre el ZIP con DecompressionStream y pasa los
// párrafos de word/document.xml al HTML de la suite. Sin dependencias: corre en el navegador (PS_DOCX) y en Node.
(function (root) {
  // Archivos del ZIP: { nombre: Uint8Array }. Solo métodos 0 (guardado) y 8 (deflate), los que usa Word.
  async function unzip(buf) {
    const bytes = new Uint8Array(buf);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let end = bytes.length - 22;
    while (end >= 0 && view.getUint32(end, true) !== 0x06054b50) end--;
    if (end < 0) throw new Error('No es un archivo .docx');
    const count = view.getUint16(end + 10, true);
    let p = view.getUint32(end + 16, true);
    const out = {};
    for (let k = 0; k < count; k++) {
      if (view.getUint32(p, true) !== 0x02014b50) throw new Error('ZIP dañado');
      const method = view.getUint16(p + 10, true), size = view.getUint32(p + 20, true);
      const nameLen = view.getUint16(p + 28, true), extraLen = view.getUint16(p + 30, true), commentLen = view.getUint16(p + 32, true);
      const local = view.getUint32(p + 42, true);
      const name = new TextDecoder().decode(bytes.subarray(p + 46, p + 46 + nameLen));
      const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
      const data = bytes.subarray(start, start + size);
      if (method === 0) out[name] = data;
      else if (method === 8) out[name] = new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
      p += 46 + nameLen + extraLen + commentLen;
    }
    return out;
  }

  const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
  const unxml = (s) => s.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (m, e) => (e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : ENT[e] ?? m));
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // <w:b/> o <w:b w:val="1"/> está activo; w:val="0", "false", "none" lo apaga.
  const on = (props, tag) => { const m = new RegExp(`<w:${tag}(?:\\s[^>]*)?/?>`).exec(props); return !!m && !/w:val="(0|false|off|none)"/.test(m[0]); };
  const ALIGN = { center: 'center', right: 'right', end: 'right', both: 'justify', distribute: 'justify', left: 'left', start: 'left' };

  // Una línea con dos nombres separados por tabuladores o muchos espacios es una línea de dos firmas.
  const PAIR = /^\s*(\S(?:.*?\S)?)(?:\s*\t\s*|\s{4,})(\S(?:.*?\S)?)\s*$/;

  // document.xml → { html, font, size }. font: el tipo de letra más usado; size: el tamaño más usado (pt).
  // styles: styles.xml, de donde sale el tamaño de los textos que no lo dicen.
  function toHtml(xml, styles = '') {
    const defSize = /<w:rPrDefault>[\s\S]*?<w:sz w:val="(\d+)"/.exec(styles)?.[1] || '24';
    const body = /<w:body>([\s\S]*)<\/w:body>/.exec(xml)?.[1] || '';
    const fonts = new Map(), sizes = new Map();
    const count = (map, k, n) => k && map.set(k, (map.get(k) || 0) + n);
    const paras = [];
    for (const [para] of body.matchAll(/<w:p(?:\s[^>]*)?\/>|<w:p[\s>][\s\S]*?<\/w:p>/g)) {
      const pPr = /<w:pPr>[\s\S]*?<\/w:pPr>/.exec(para)?.[0] || '';
      const align = ALIGN[/<w:jc w:val="(\w+)"/.exec(pPr)?.[1]];
      const lines = [[]]; // un salto de línea (w:br) empieza otro párrafo con la misma alineación
      for (const [run] of para.matchAll(/<w:r[\s>][\s\S]*?<\/w:r>/g)) {
        const rPr = /<w:rPr>[\s\S]*?<\/w:rPr>/.exec(run)?.[0] || '';
        const fmt = { b: on(rPr, 'b'), i: on(rPr, 'i'), u: on(rPr, 'u'), caps: on(rPr, 'caps') };
        for (const [piece, text] of run.replace(/<w:rPr>[\s\S]*?<\/w:rPr>/, '').matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:tab\/>|<w:br(?:\s[^>]*)?\/>|<w:noBreakHyphen\/>/g)) {
          if (piece.startsWith('<w:br')) { if (!/w:type="(page|column)"/.test(piece)) lines.push([]); continue; }
          let t = piece.startsWith('<w:tab') ? '\t' : piece.startsWith('<w:noBreak') ? '-' : unxml(text);
          if (fmt.caps) t = t.toLocaleUpperCase('es');
          lines[lines.length - 1].push({ t, ...fmt });
          if (t.trim()) {
            count(fonts, /<w:rFonts [^>]*w:ascii="([^"]+)"/.exec(rPr)?.[1], t.length);
            count(sizes, /<w:sz w:val="(\d+)"/.exec(rPr)?.[1] || defSize, t.length);
          }
        }
      }
      for (const runs of lines) paras.push(paragraph(runs, align));
    }
    // Al pie de cada escritura, los nombres centrados tras un renglón en blanco y los renglones en blanco antes de
    // una firma son líneas de firma: sin guiones y sin partirse entre páginas.
    paras.forEach((p, k) => { if (p.kind === 'center' && /^(blank|firma)$/.test(paras[k - 1]?.kind)) Object.assign(p, { kind: 'firma', html: `<p class="firma">${p.inner}</p>` }); });
    for (let k = paras.length - 2; k >= 0; k--) if (paras[k].kind === 'blank' && paras[k + 1].kind === 'firma') Object.assign(paras[k], { kind: 'firma', html: '<p class="firma"><br></p>' });
    const top = (map) => [...map].sort((a, b) => b[1] - a[1])[0]?.[0];
    const sz = Number(top(sizes)) / 2;
    return { html: paras.map((p) => p.html).join(''), font: top(fonts) || null, size: sz >= 8 && sz <= 16 ? sz : null };
  }

  function paragraph(runs, align) {
    const raw = runs.map((r) => r.t).join('');
    if (!raw.trim()) return { kind: 'blank', html: '<p><br></p>' };
    const style = align ? ` style="text-align:${align}"` : '';
    const pair = raw.length < 140 && PAIR.exec(raw);
    // Con espacios (no tabuladores) solo si los dos lados van en mayúsculas, como los nombres al pie.
    const upper = pair && !/\p{Ll}/u.test(pair[1] + pair[2]);
    if (pair && pair[1].length <= 70 && pair[2].length <= 70 && !/[:.;]$/.test(pair[1]) && (upper || raw.includes('\t'))) {
      const bold = runs.every((r) => r.b || !r.t.trim());
      const half = (s) => `<span class="f2">${bold ? `<b>${esc(s)}</b>` : esc(s)}</span>`;
      return { kind: 'firma', html: `<p class="firma">${half(pair[1])}${half(pair[2])}</p>` };
    }
    // Los espacios de los bordes (sangrías hechas a mano) se quitan; los de adentro se ven como uno.
    const text = runs.map((r) => r.t.replace(/\t/g, ' '));
    const first = text.findIndex((t) => t.trim()), last = text.findLastIndex((t) => t.trim());
    text[first] = text[first].trimStart();
    text[last] = text[last].trimEnd();
    // Word parte el texto en trozos con el mismo formato: se juntan antes de marcarlos.
    const parts = [];
    runs.forEach((r, k) => {
      if (k < first || k > last || !text[k]) return;
      const prev = parts[parts.length - 1];
      if (prev && prev.b === r.b && prev.i === r.i && prev.u === r.u) prev.t += text[k];
      else parts.push({ ...r, t: text[k] });
    });
    const html = parts.map((r) => {
      let h = esc(r.t);
      if (r.u) h = `<u>${h}</u>`;
      if (r.i) h = `<i>${h}</i>`;
      return r.b ? `<b>${h}</b>` : h;
    }).join('');
    return { kind: align === 'center' && raw.trim().length <= 80 ? 'center' : 'text', inner: html, html: `<p${style}>${html}</p>` };
  }

  async function read(buf) {
    const files = await unzip(buf);
    if (!files['word/document.xml']) throw new Error('No es un documento de Word (.docx)');
    const text = (name) => (files[name] ? new TextDecoder().decode(files[name]) : '');
    return toHtml(text('word/document.xml'), text('word/styles.xml'));
  }

  const api = { read, unzip, toHtml };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PS_DOCX = api;
})(this);
