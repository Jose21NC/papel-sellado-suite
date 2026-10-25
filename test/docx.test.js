// node --test test/
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { read } = require('../js/docx.js');

test('protocolo .docx a párrafos de la suite (con las líneas de firma)', async () => {
  const { html, font, size } = await read(fs.readFileSync(path.join(__dirname, 'fixtures/protocolo-prueba.docx')));
  assert.strictEqual(font, 'Arial');
  assert.strictEqual(size, 13);
  const ps = html.split('</p>').slice(0, -1).map((p) => p + '</p>');
  assert.deepStrictEqual(ps, [
    '<p style="text-align:center"><b>ACTA DE APERTURA</b></p>',
    '<p style="text-align:justify">Texto con &amp; y &lt;signos&gt;, negrita apagada y <i>cursiva</i> y <u>subrayado</u> y VERSALITAS.</p>',
    '<p><br></p>',
    '<p>Primera línea</p>',
    '<p>segunda línea</p>',
    '<p class="firma"><br></p>',
    '<p class="firma"><span class="f2"><b>JUAN PÉREZ</b></span><span class="f2"><b>ANA RUIZ</b></span></p>',
    '<p class="firma"><span class="f2">VENDEDOR</span><span class="f2">COMPRADOR</span></p>',
    '<p>Dice: que vende           la casa.</p>',
    '<p class="firma"><br></p>',
    '<p class="firma"><b>NOTARIO PÚBLICO</b></p>',
  ]);
});

test('un archivo que no es .docx se rechaza', async () => {
  await assert.rejects(read(Buffer.from('hola')), /docx/);
});
