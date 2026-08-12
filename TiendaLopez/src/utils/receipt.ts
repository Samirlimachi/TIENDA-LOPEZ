import { Sale } from '@models/index';
import { LOGO_BASE64 } from '@assets/logoBase64';
import { amountToWords } from './numberToWords';

const formatDate = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleString('es-BO', {
    timeZone: 'America/La_Paz',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const buildReceiptHtml = (sale: Sale): string => {
  const itemsRows = sale.items
    .map(
      item => `
        <tr>
          <td class="cant">${item.quantity}</td>
          <td class="desc">${escapeHtml(item.product_name)}</td>
          <td class="num">${Number(item.unit_price).toFixed(2)}</td>
          <td class="num">${Number(item.subtotal).toFixed(2)}</td>
        </tr>`,
    )
    .join('');

  const paymentRows =
    sale.payment_method === 'efectivo'
      ? `
        <div class="row"><span>EFECTIVO:</span><span>${Number(sale.amount_received).toFixed(2)} Bs.</span></div>
        <div class="row"><span>CAMBIO:</span><span>${Number(sale.change_given).toFixed(2)} Bs.</span></div>`
      : `<div class="row"><span>PAGO:</span><span>QR</span></div>`;

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: 'Courier New', monospace;
            width: 320px;
            margin: 0 auto;
            padding: 16px 8px;
            color: #000;
          }
          .header { text-align: center; margin-bottom: 8px; }
          .header img { width: 90px; height: auto; }
          .header h1 { font-size: 16px; margin: 4px 0 0; }
          .header p { font-size: 11px; margin: 2px 0; }
          hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
          .row { display: flex; justify-content: space-between; font-size: 12px; margin: 2px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin: 8px 0; }
          th { text-align: left; border-bottom: 1px solid #000; padding-bottom: 2px; }
          td { padding: 2px 0; vertical-align: top; }
          .cant { width: 24px; }
          .num { text-align: right; white-space: nowrap; }
          .total-row { font-weight: bold; font-size: 13px; }
          .words { font-size: 11px; margin-top: 6px; text-transform: uppercase; }
          .footer { text-align: center; font-size: 11px; margin-top: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="data:image/png;base64,${LOGO_BASE64}" />
          <h1>TIENDA LOPEZ</h1>
          <p>Todo lo que necesitas</p>
        </div>
        <hr />
        <div class="row"><span>FECHA:</span><span>${formatDate(sale.created_at)}</span></div>
        <div class="row"><span>CLIENTE:</span><span>${escapeHtml(sale.customer_name)}</span></div>
        ${sale.customer_ci ? `<div class="row"><span>CI:</span><span>${escapeHtml(sale.customer_ci)}</span></div>` : ''}
        ${sale.customer_nit ? `<div class="row"><span>NIT:</span><span>${escapeHtml(sale.customer_nit)}</span></div>` : ''}
        <hr />
        <table>
          <thead>
            <tr>
              <th class="cant">Cant</th>
              <th>Descripción</th>
              <th class="num">Precio</th>
              <th class="num">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>
        <hr />
        <div class="row total-row"><span>MONTO A PAGAR:</span><span>${Number(sale.total).toFixed(2)} Bs.</span></div>
        ${paymentRows}
        <div class="words">SON: ${amountToWords(Number(sale.total))}</div>
        <hr />
        <div class="footer">Emitido por: ${escapeHtml(sale.seller_username ?? '')}</div>
      </body>
    </html>
  `;
};
