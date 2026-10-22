// Lectura de los datos del papel sellado digital de la DGI a partir del texto de cada página.
// Funciones puras: se usan en el navegador (global PS_PARSE) y en las pruebas de Node.
(function (root) {
  // Geometría por defecto en puntos, medida desde el borde superior (papel legal 612 x 1008 pt, 30 renglones de 1 cm).
  const DEFAULT_GEOMETRY = {
    width: 612, height: 1008,
    firstRule: 100, lineHeight: 28.35, lines: 30,
    left: 37, right: 568, sealRight: 197, sealLines: 3,
  };

  // Valores vigentes (2026: protocolo C$14, testimonio C$21) y anteriores, para clasificar por valor.
  const TYPE_BY_VALUE = { 21: 'testimonio', 19: 'testimonio', 14: 'protocolo', 12: 'protocolo', 10: 'protocolo' };
  const NOT_SERIE = new Set(['SERIE', 'FRENTE', 'REVERSO', 'REPUBLICA', 'NICARAGUA', 'CORDOBAS', 'CÓRDOBAS', 'VALE', 'NO']);

  // items: [{str, x, y, size}] con y medida desde abajo, como la entrega pdf.js.
  function parsePage(items, width, height) {
    const top = (it) => height - it.y;
    const text = items.filter((it) => it.str && it.str.trim());
    const out = { side: null, value: null, serie: null, numero: null, geometry: { ...DEFAULT_GEOMETRY, width, height } };

    if (text.some((it) => it.str.trim() === 'FRENTE')) out.side = 'frente';
    if (text.some((it) => it.str.trim() === 'REVERSO')) out.side = 'reverso';

    // Los números de renglón (1..30) están en el margen izquierdo y marcan dónde cae cada línea.
    const labels = new Map();
    for (const it of text) {
      if (it.x < 36 && /^\d{1,2}$/.test(it.str.trim())) labels.set(Number(it.str), top(it));
    }
    // Los números no están parejos respecto de su raya (±2 pt): se ajusta una recta con todos ellos.
    const n = labels.size;
    if (n >= 10 && labels.has(1) && labels.has(n)) {
      let sx = 0, sy = 0, sxx = 0, sxy = 0;
      for (const [k, y] of labels) { sx += k; sy += y; sxx += k * k; sxy += k * y; }
      const lh = (n * sxy - sx * sy) / (n * sxx - sx * sx);
      const first = (sy - lh * sx) / n + lh;
      if (lh > 15 && lh < 45) Object.assign(out.geometry, { firstRule: first, lineHeight: lh, lines: n });
    }

    // Valor: el número grande en el sello de la parte superior.
    const big = text.find((it) => it.size >= 16 && top(it) < 120 && /^\d{1,4}$/.test(it.str.trim()));
    if (big) out.value = Number(big.str);

    // Serie y número van en la misma línea que la palabra SERIE.
    const serieLabel = text.find((it) => it.str.trim() === 'SERIE');
    if (serieLabel) {
      const same = text.filter((it) => Math.abs(it.y - serieLabel.y) < 4 && it.x > serieLabel.x);
      const s = same.find((it) => /^[A-Z]{2,12}$/.test(it.str.trim()) && !NOT_SERIE.has(it.str.trim()));
      const num = same.find((it) => /^\d{4,}$/.test(it.str.trim()));
      if (s) out.serie = s.str.trim();
      if (num) out.numero = num.str.trim();
    }
    return out;
  }

  function typeFor(value, filename) {
    const f = (filename || '').toLowerCase();
    if (f.includes('protocolo')) return 'protocolo';
    if (f.includes('testimonio')) return 'testimonio';
    return TYPE_BY_VALUE[value] || 'otro';
  }

  // Agrupa las páginas de un PDF en hojas (frente + reverso) por serie y número.
  function groupSheets(pages, filename) {
    const sheets = [];
    pages.forEach((p, index) => {
      const last = sheets[sheets.length - 1];
      const key = p.serie && p.numero ? p.serie + '-' + p.numero : null;
      const side = p.side || (index % 2 === 0 ? 'frente' : 'reverso');
      const sameSheet = last && last.pages.length === 1 && side === 'reverso' && (!key || last.key === key);
      const page = { index, side, geometry: p.geometry };
      if (sameSheet) {
        last.pages.push(page);
        last.value = last.value || p.value;
        return;
      }
      sheets.push({ key, serie: p.serie, numero: p.numero, value: p.value, pages: [page] });
    });
    for (const s of sheets) s.type = typeFor(s.value, filename);
    return sheets;
  }

  const api = { DEFAULT_GEOMETRY, TYPE_BY_VALUE, parsePage, typeFor, groupSheets };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PS_PARSE = api;
})(this);
