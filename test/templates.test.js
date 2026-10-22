// node --test test/
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { build } = require('../js/templates.js');
// templates-data.js es un script de navegador: se evalúa para obtener la lista.
const PLANTILLAS = new Function(fs.readFileSync(path.join(__dirname, '../js/templates-data.js'), 'utf8') + '; return PLANTILLAS;')();

const d = new Date(2026, 9, 22, 10, 30);
const notario = { nombre: 'Ana <b>Pérez</b>', titulo: 'Abogada y Notaria Pública', notario: 'si', domicilio: 'Managua', carnet: '12345', quinquenio: '2029-03-15', ciudad: 'León', protocolo: '12', protocoloAnio: '2026' };
const poder = PLANTILLAS.find((t) => t.id === 'poder-generalisimo');

test('llena perfil, número y fecha en letras; escapa los datos', () => {
  const html = build(poder, notario, d, '25');
  assert.match(html, /ESCRITURA PÚBLICA NÚMERO VEINTICINCO \(25\)/);
  assert.match(html, /En la ciudad de León, a las diez y treinta minutos de la mañana del día veintidós de octubre del año dos mil veintiséis/);
  assert.match(html, /ANA &lt;B&gt;PÉREZ&lt;\/B&gt;/);
  assert.match(html, /debidamente autorizada por la Excelentísima Corte Suprema de Justicia/);
  assert.match(html, /quinquenio que vence el día quince de marzo del año dos mil veintinueve/);
  assert.match(html, /yo, la Notaria, instruí/);
  assert.match(html, /<span class="campo">\[NOMBRE DEL APODERADO\]<\/span>/);
  assert.doesNotMatch(html, /<b>Pérez/);
});

test('sin datos o sin ser notario quedan campos visibles', () => {
  const html = build(poder, { ...notario, notario: 'no' }, d, '');
  assert.match(html, /<span class="campo">\[NÚMERO EN LETRAS \(EN CIFRAS\)\]<\/span>/);
  assert.match(html, /<span class="campo">\[NOMBRE DEL NOTARIO\]<\/span>/);
  assert.match(html, /<span class="campo">\[FECHA EN QUE VENCE EL QUINQUENIO\]<\/span>/);
  assert.match(build(poder, {}, d, '0'), /<span class="campo">\[CIUDAD\]<\/span>/);
});

test('todas las plantillas se arman sin claves sueltas y solo con etiquetas permitidas', () => {
  assert.ok(PLANTILLAS.length >= 30, PLANTILLAS.length);
  assert.strictEqual(new Set(PLANTILLAS.map((t) => t.id)).size, PLANTILLAS.length);
  for (const t of PLANTILLAS) {
    const html = build(t, notario, d, '7');
    assert.doesNotMatch(html, /[{}]/, t.id);
    for (const [, tag] of html.matchAll(/<\/?([a-z0-9]+)/gi)) assert.ok(['p', 'b', 'i', 'u', 'span'].includes(tag), `${t.id}: ${tag}`);
    assert.doesNotMatch(html, /<span(?! class="campo">)/, t.id);
  }
  assert.match(build(PLANTILLAS.find((t) => t.id === 'cierre-testimonio'), notario, d), /Protocolo número DOCE \(12\) que llevo durante el año dos mil veintiséis/);
});

test('campos: cómo se escribe cada dato', () => {
  const { fieldKind: k, fieldText: t } = require('../js/templates.js');
  const put = (label, v) => t(k(label), v);
  assert.strictEqual(put('NÚMERO DE CÉDULA', '001-01A'), 'cero, cero, uno, guion, cero, uno, letra A (001-01A)');
  assert.strictEqual(put('NÚMERO DE CARNÉ', '12345'), 'doce mil trescientos cuarenta y cinco (12345)');
  assert.strictEqual(put('PRECIO EN LETRAS', '1,500'), 'mil quinientos');
  assert.strictEqual(put('TOMO', '45'), 'cuarenta y cinco (45)');
  assert.strictEqual(put('NÚMERO DE FINCA', '12-A'), 'uno, dos, guion, letra A (12-A)');
  assert.strictEqual(put('PORCENTAJE', '51'), 'cincuenta y uno por ciento (51 %)');
  assert.strictEqual(put('FECHA EN LETRAS', '2026-10-01'), 'primero de octubre del año dos mil veintiséis');
  assert.strictEqual(put('HORA EN LETRAS', '13:05'), 'la una y cinco minutos de la tarde');
  assert.strictEqual(put('NOMBRE DEL VENDEDOR', ' Ana Ruiz '), 'Ana Ruiz');
  assert.strictEqual(put('NÚMERO Y MONTO DE LAS CUOTAS', 'doce'), 'doce');
  assert.strictEqual(put('FECHA EN LETRAS', ''), '');
});
