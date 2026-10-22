// node --test test/
const test = require('node:test');
const assert = require('node:assert');
const { numberToWords: w, dateToWords, timeToWords, dateTimeToWords, isoDateToWords } = require('../js/words.js');

test('números en letras', () => {
  const cases = {
    0: 'cero', 1: 'uno', 15: 'quince', 16: 'dieciséis', 21: 'veintiuno', 22: 'veintidós', 30: 'treinta', 31: 'treinta y uno',
    99: 'noventa y nueve', 100: 'cien', 101: 'ciento uno', 115: 'ciento quince', 200: 'doscientos', 555: 'quinientos cincuenta y cinco',
    1000: 'mil', 1001: 'mil uno', 2026: 'dos mil veintiséis', 21000: 'veintiún mil', 31500: 'treinta y un mil quinientos',
    100000: 'cien mil', 101000: 'ciento un mil', 1000000: 'un millón', 2500000: 'dos millones quinientos mil',
    21000000: 'veintiún millones', 1000000000: 'mil millones',
  };
  for (const [n, txt] of Object.entries(cases)) assert.strictEqual(w(Number(n)), txt, n);
  assert.strictEqual(w(21, true), 'veintiún');
  assert.strictEqual(w(1, true), 'un');
  assert.strictEqual(w(41, true), 'cuarenta y un');
  assert.throws(() => w(-1), RangeError);
  assert.throws(() => w(1.5), RangeError);
});

test('fecha y hora como en la escritura', () => {
  const d = new Date(2026, 9, 22, 10, 30);
  assert.strictEqual(dateTimeToWords(d), 'a las diez y treinta minutos de la mañana del día veintidós de octubre del año dos mil veintiséis');
  assert.strictEqual(dateToWords(new Date(2021, 0, 1)), 'primero de enero del año dos mil veintiuno');
  assert.strictEqual(timeToWords(new Date(2026, 0, 1, 13, 0)), 'la una de la tarde');
  assert.strictEqual(timeToWords(new Date(2026, 0, 1, 12, 0)), 'las doce meridiano');
  assert.strictEqual(timeToWords(new Date(2026, 0, 1, 12, 15)), 'las doce y quince minutos de la tarde');
  assert.strictEqual(timeToWords(new Date(2026, 0, 1, 9, 1)), 'las nueve y un minuto de la mañana');
  assert.strictEqual(timeToWords(new Date(2026, 0, 1, 18, 21)), 'las seis y veintiún minutos de la tarde');
  assert.strictEqual(timeToWords(new Date(2026, 0, 1, 20, 45)), 'las ocho y cuarenta y cinco minutos de la noche');
  assert.strictEqual(timeToWords(new Date(2026, 0, 1, 0, 0)), 'las doce de la noche');
});

test('fecha ISO del quinquenio', () => {
  assert.strictEqual(isoDateToWords('2029-03-15'), 'quince de marzo del año dos mil veintinueve');
  assert.strictEqual(isoDateToWords(''), '');
  assert.strictEqual(isoDateToWords('2029-02-30'), '');
  assert.strictEqual(isoDateToWords('15/03/2029'), '');
});
