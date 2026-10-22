// node --test test/
const test = require('node:test');
const assert = require('node:assert');
const { parsePage, groupSheets, typeFor } = require('../js/parse.js');

// Texto tal como lo entrega pdf.js para una hoja de testimonio de la DGI (serie y número inventados).
// Altura real de los números de renglón en un PDF de la DGI: no están parejos respecto de sus rayas.
const LABEL_Y = [909, 877, 850, 822, 795, 766, 738, 708, 681, 653, 624, 595, 567, 538, 510, 482, 453, 425, 396, 368, 341, 312, 284, 256, 227, 199, 171, 142, 114, 85];
const labels = (x0) => LABEL_Y.map((y, i) => ({ str: String(i + 1), x: i < 9 ? x0 + 6 : x0, y, size: 12 }));
const frente = [
  ...labels(17),
  { str: 'FRENTE', x: 7, y: 960, size: 11 },
  { str: '21', x: 218, y: 955, size: 20 },
  { str: 'VEINTIÚN', x: 261, y: 958, size: 11 },
  { str: 'CORDOBAS', x: 319, y: 958, size: 11 },
  { str: 'SERIE', x: 41, y: 863, size: 10 },
  { str: 'ABCDEF', x: 79, y: 863, size: 10 },
  { str: '12345678', x: 149, y: 863, size: 11 },
  { str: 'N', x: 572, y: 840, size: 4 },
];
const reverso = [
  ...labels(17),
  { str: 'REVERSO', x: 4, y: 960, size: 11 },
  { str: 'SERIE', x: 416, y: 955, size: 10 },
  { str: 'ABCDEF', x: 454, y: 955, size: 10 },
  { str: '12345678', x: 521, y: 955, size: 11 },
];

test('lee valor, serie, número, cara y renglones', () => {
  const p = parsePage(frente, 612, 1008);
  assert.strictEqual(p.side, 'frente');
  assert.strictEqual(p.value, 21);
  assert.strictEqual(p.serie, 'ABCDEF');
  assert.strictEqual(p.numero, '12345678');
  assert.strictEqual(p.geometry.lines, 30);
  // Rayas reales de ese PDF: la primera en 100.35 pt y separadas 28.357 pt.
  assert.ok(Math.abs(p.geometry.firstRule - 100.35) < 0.6, p.geometry.firstRule);
  assert.ok(Math.abs(p.geometry.lineHeight - 28.357) < 0.05, p.geometry.lineHeight);
  assert.strictEqual(parsePage(reverso, 612, 1008).side, 'reverso');
});

test('agrupa frente y reverso en una sola hoja y la clasifica', () => {
  const sheets = groupSheets([parsePage(frente, 612, 1008), parsePage(reverso, 612, 1008)], 'papel.pdf');
  assert.strictEqual(sheets.length, 1);
  assert.deepStrictEqual(sheets[0].pages.map((p) => p.side), ['frente', 'reverso']);
  assert.strictEqual(sheets[0].type, 'testimonio');
  assert.strictEqual(sheets[0].value, 21);
});

test('dos hojas distintas en un mismo PDF', () => {
  const other = (arr) => arr.map((it) => (it.str === '12345678' ? { ...it, str: '12345679' } : it));
  const pages = [frente, reverso, other(frente), other(reverso)].map((t) => parsePage(t, 612, 1008));
  const sheets = groupSheets(pages, 'x.pdf');
  assert.deepStrictEqual(sheets.map((s) => s.numero), ['12345678', '12345679']);
});

test('clasificación por valor y por nombre de archivo', () => {
  assert.strictEqual(typeFor(14, ''), 'protocolo');
  assert.strictEqual(typeFor(21, ''), 'testimonio');
  assert.strictEqual(typeFor(99, 'Papel Sellado Protocolo.pdf'), 'protocolo');
  assert.strictEqual(typeFor(99, ''), 'otro');
});

test('PDF sin texto reconocible usa la geometría por defecto', () => {
  const p = parsePage([], 612, 1008);
  assert.strictEqual(p.geometry.lines, 30);
  assert.strictEqual(p.value, null);
});
