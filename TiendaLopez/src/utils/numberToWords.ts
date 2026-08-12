const UNITS = [
  '', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE',
  'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE',
  'DIECIOCHO', 'DIECINUEVE', 'VEINTE',
];
const TENS = [
  '', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA',
  'OCHENTA', 'NOVENTA',
];
const HUNDREDS = [
  '', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS',
  'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS',
];

const threeDigitsToWords = (n: number): string => {
  if (n === 0) {
    return '';
  }
  if (n === 100) {
    return 'CIEN';
  }
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  let words = hundred > 0 ? HUNDREDS[hundred] : '';
  if (rest > 0) {
    words += (words ? ' ' : '') + twoDigitsToWords(rest);
  }
  return words;
};

const twoDigitsToWords = (n: number): string => {
  if (n <= 20) {
    return UNITS[n];
  }
  const ten = Math.floor(n / 10);
  const unit = n % 10;
  if (unit === 0) {
    return TENS[ten];
  }
  if (ten === 2) {
    return `VEINTI${UNITS[unit]}`;
  }
  return `${TENS[ten]} Y ${UNITS[unit]}`;
};

const integerToWords = (value: number): string => {
  if (value === 0) {
    return 'CERO';
  }
  if (value < 0) {
    return `MENOS ${integerToWords(-value)}`;
  }

  const millions = Math.floor(value / 1000000);
  const thousands = Math.floor((value % 1000000) / 1000);
  const rest = value % 1000;

  const parts: string[] = [];
  if (millions > 0) {
    parts.push(millions === 1 ? 'UN MILLÓN' : `${threeDigitsToWords(millions)} MILLONES`);
  }
  if (thousands > 0) {
    parts.push(thousands === 1 ? 'MIL' : `${threeDigitsToWords(thousands)} MIL`);
  }
  if (rest > 0) {
    parts.push(threeDigitsToWords(rest));
  }
  return parts.join(' ');
};

// Convierte un monto (ej. 99.5) a texto tipo recibo boliviano:
// "NOVENTA Y NUEVE CON 50/100 BOLIVIANOS"
export const amountToWords = (amount: number): string => {
  const rounded = Math.round(amount * 100) / 100;
  const wholePart = Math.floor(rounded);
  const cents = Math.round((rounded - wholePart) * 100);
  const centsStr = String(cents).padStart(2, '0');
  return `${integerToWords(wholePart)} CON ${centsStr}/100 BOLIVIANOS`;
};
