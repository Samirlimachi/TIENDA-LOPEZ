import barcodes from 'jsbarcode/src/barcodes';

// Mismo trazado de barras que usa <Barcode> en pantalla (react-native-barcode-svg),
// pero devolviendo <rect> de SVG en vez de <Path> de react-native-svg, para poder
// incrustarlo en el HTML que se manda a imprimir.
const SINGLE_BAR_WIDTH = 2;

function linearizeEncodings(encoded: unknown, out: any[] = []): any[] {
  if (Array.isArray(encoded)) {
    encoded.forEach(item => linearizeEncodings(item, out));
  } else {
    out.push(encoded);
  }
  return out;
}

function drawBars(binary: string, paddingLeft: number, height: number): string[] {
  const rects: string[] = [];
  let barWidth = 0;
  let x = 0;
  for (let b = 0; b < binary.length; b++) {
    x = b * SINGLE_BAR_WIDTH + paddingLeft;
    if (binary[b] === '1') {
      barWidth++;
    } else if (barWidth > 0) {
      rects.push(
        `<rect x="${x - SINGLE_BAR_WIDTH * barWidth}" y="0" width="${SINGLE_BAR_WIDTH * barWidth}" height="${height}" />`,
      );
      barWidth = 0;
    }
  }
  if (barWidth > 0) {
    rects.push(
      `<rect x="${x - SINGLE_BAR_WIDTH * (barWidth - 1)}" y="0" width="${SINGLE_BAR_WIDTH * barWidth}" height="${height}" />`,
    );
  }
  return rects;
}

export const barcodeFormatFor = (value: string): 'EAN13' | 'CODE128' =>
  /^\d{12,13}$/.test(value) ? 'EAN13' : 'CODE128';

export function buildBarcodeSvg(value: string, height = 80): string {
  const format = barcodeFormatFor(value);
  const Encoder = barcodes[format];
  const encoder = new Encoder(value, {});
  if (!encoder.valid()) {
    throw new Error('Código inválido para generar el código de barras');
  }
  const segments = linearizeEncodings(encoder.encode());

  let paddingLeft = 0;
  const rects: string[] = [];
  segments.forEach(segment => {
    rects.push(...drawBars(segment.data, paddingLeft, height));
    paddingLeft += segment.data.length * SINGLE_BAR_WIDTH;
  });

  return `<svg width="${paddingLeft}" height="${height}" viewBox="0 0 ${paddingLeft} ${height}" xmlns="http://www.w3.org/2000/svg">${rects.join('')}</svg>`;
}

export const buildBarcodeLabelHtml = (code: string, productName?: string): string => `
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        * { box-sizing: border-box; }
        body {
          font-family: 'Courier New', monospace;
          width: 260px;
          margin: 0 auto;
          padding: 16px 8px;
          text-align: center;
          color: #000;
        }
        .name { font-size: 13px; font-weight: bold; margin-bottom: 6px; word-break: break-word; }
        svg { width: 100%; height: 80px; }
        .code { font-size: 12px; letter-spacing: 1px; margin-top: 4px; }
      </style>
    </head>
    <body>
      ${productName ? `<div class="name">${productName}</div>` : ''}
      ${buildBarcodeSvg(code)}
      <div class="code">${code}</div>
    </body>
  </html>
`;
