// node --test test/
const test = require('node:test');
const assert = require('node:assert');
const { toValue, fromValue } = require('../js/cloud.js');

test('trabajos de ida y vuelta por el formato de Firestore', () => {
  const w = {
    id: 'w1', title: 'Poder', paperValue: null, printedChars: 59, settings: { size: 12.5, dashes: true, font: 'Arial' },
    pages: ['<p>uno</p>', ''], paperIds: ['p1', null], printLog: [{ at: '2026-10-22', mode: 'texto', pages: 2 }], label: undefined, _plain: 'caché',
  };
  const v = toValue(w);
  assert.strictEqual(v.mapValue.fields.printedChars.integerValue, '59');
  assert.strictEqual(v.mapValue.fields.settings.mapValue.fields.size.doubleValue, 12.5);
  assert.ok(!('_plain' in v.mapValue.fields) && !('label' in v.mapValue.fields));
  const back = fromValue(v);
  delete w._plain;
  delete w.label;
  assert.deepStrictEqual(back, w);
});

test('los PDF van en trozos de bytes', () => {
  const bytes = Uint8Array.from({ length: 70000 }, (_, i) => (i * 31) % 256);
  const v = toValue({ id: 'f1-0', file: 'f1', data: bytes });
  assert.strictEqual(typeof v.mapValue.fields.data.bytesValue, 'string');
  assert.deepStrictEqual(fromValue(v).data, bytes);
});
