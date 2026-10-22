// Números, fechas y horas en letras, como los exige la escritura notarial (Ley del Notariado, Art. 15 Nº 5).
// Funciones puras: se usan en el navegador (global PS_WORDS) y en las pruebas de Node.
(function (root) {
  const UNITS = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce',
    'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco',
    'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
  const TENS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const HUNDREDS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
  const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  // "uno" se acorta delante de un sustantivo masculino: un minuto, veintiún minutos, treinta y un mil.
  const apocope = (s) => s.replace(/veintiuno$/, 'veintiún').replace(/uno$/, 'un');

  function below1000(n) {
    if (n === 100) return 'cien';
    const h = Math.floor(n / 100), r = n % 100;
    const parts = h ? [HUNDREDS[h]] : [];
    if (r) parts.push(r < 30 ? UNITS[r] : TENS[Math.floor(r / 10)] + (r % 10 ? ' y ' + UNITS[r % 10] : ''));
    return parts.join(' ');
  }

  // Entero de 0 a 999 999 999 999. short: forma apocopada (delante de sustantivo masculino).
  function numberToWords(n, short) {
    if (!Number.isInteger(n) || n < 0 || n > 999999999999) throw new RangeError('Número fuera de rango: ' + n);
    if (n === 0) return 'cero';
    const millions = Math.floor(n / 1e6), thousands = Math.floor(n / 1000) % 1000, rest = n % 1000;
    const parts = [];
    if (millions) parts.push(millions === 1 ? 'un millón' : apocope(numberToWords(millions)) + ' millones');
    if (thousands) parts.push(thousands === 1 ? 'mil' : apocope(below1000(thousands)) + ' mil');
    if (rest) parts.push(below1000(rest));
    const s = parts.join(' ');
    return short ? apocope(s) : s;
  }

  // "veintidós de octubre del año dos mil veintiséis"
  function dateToWords(d) {
    const day = d.getDate() === 1 ? 'primero' : numberToWords(d.getDate());
    return `${day} de ${MONTHS[d.getMonth()]} del año ${numberToWords(d.getFullYear())}`;
  }

  // "las diez y treinta minutos de la mañana" · "la una de la tarde" · "las doce meridiano"
  function timeToWords(d) {
    const h = d.getHours(), m = d.getMinutes();
    if (h === 12 && m === 0) return 'las doce meridiano';
    const h12 = h % 12 || 12;
    const hour = h12 === 1 ? 'la una' : 'las ' + numberToWords(h12);
    const mins = m ? ` y ${numberToWords(m, true)} minuto${m === 1 ? '' : 's'}` : '';
    const part = h === 0 || h >= 19 ? 'de la noche' : h < 12 ? 'de la mañana' : 'de la tarde';
    return `${hour}${mins} ${part}`;
  }

  // "a las diez y treinta minutos de la mañana del día veintidós de octubre del año dos mil veintiséis"
  const dateTimeToWords = (d) => `a ${timeToWords(d)} del día ${dateToWords(d)}`;

  // "2029-03-15" (valor de <input type="date">) → fecha local en letras, o '' si no es una fecha válida.
  function isoDateToWords(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return '';
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return d.getMonth() === Number(m[2]) - 1 ? dateToWords(d) : '';
  }

  const api = { numberToWords, dateToWords, timeToWords, dateTimeToWords, isoDateToWords };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PS_WORDS = api;
})(this);
