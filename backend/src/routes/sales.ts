import { Router } from 'express';
import { pool } from '../db';
import { requireAuth } from '../middleware/auth';

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const salesRouter = Router();

salesRouter.use(requireAuth);

interface SaleItemInput {
  product_id: number;
  quantity: number;
  price_type: 'price' | 'price2';
}

salesRouter.post('/', async (req, res) => {
  const items: SaleItemInput[] = Array.isArray(req.body?.items) ? req.body.items : [];
  const { customer_id, customer_name, customer_ci, customer_nit, payment_method, amount_received } =
    req.body ?? {};

  if (items.length === 0) {
    return res.status(400).json({ error: 'Agregá al menos un producto a la venta' });
  }
  for (const item of items) {
    if (!item.product_id || !Number.isInteger(item.quantity) || item.quantity <= 0) {
      return res.status(400).json({ error: 'Cantidad inválida en uno de los productos' });
    }
    if (item.price_type !== 'price' && item.price_type !== 'price2') {
      return res.status(400).json({ error: 'Precio inválido en uno de los productos' });
    }
  }
  if (!customer_name || !String(customer_name).trim()) {
    return res.status(400).json({ error: 'Ingresá el nombre del cliente' });
  }
  if (payment_method !== 'qr' && payment_method !== 'efectivo') {
    return res.status(400).json({ error: 'Elegí un tipo de pago (QR o efectivo)' });
  }
  if (payment_method === 'efectivo' && (amount_received === undefined || amount_received === null)) {
    return res.status(400).json({ error: 'Ingresá el monto recibido en efectivo' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let total = 0;
    const rowsToInsert: {
      product_id: number;
      product_name: string;
      product_code: string;
      quantity: number;
      unit_price: number;
      subtotal: number;
    }[] = [];

    for (const item of items) {
      const [productRows] = await connection.query(
        'SELECT id, code, name, price, price2, stock FROM products WHERE id = ? FOR UPDATE',
        [item.product_id],
      );
      const product = (productRows as any[])[0];
      if (!product) {
        throw new HttpError(404, `Producto ${item.product_id} no encontrado`);
      }
      const unitPrice = item.price_type === 'price' ? product.price : product.price2;
      if (unitPrice === null || unitPrice === undefined) {
        throw new HttpError(
          400,
          `"${product.name}" no tiene cargado ese precio`,
        );
      }
      if (product.stock < item.quantity) {
        throw new HttpError(
          400,
          `Stock insuficiente para "${product.name}" (disponible: ${product.stock})`,
        );
      }
      const subtotal = Number(unitPrice) * item.quantity;
      total += subtotal;
      rowsToInsert.push({
        product_id: product.id,
        product_name: product.name,
        product_code: product.code,
        quantity: item.quantity,
        unit_price: Number(unitPrice),
        subtotal,
      });
    }

    const finalAmountReceived =
      payment_method === 'efectivo' ? Number(amount_received) : total;
    if (payment_method === 'efectivo' && finalAmountReceived < total) {
      throw new HttpError(
        400,
        `El monto recibido (Bs. ${finalAmountReceived.toFixed(2)}) es menor al total (Bs. ${total.toFixed(2)})`,
      );
    }
    const changeGiven = payment_method === 'efectivo' ? finalAmountReceived - total : 0;

    for (const row of rowsToInsert) {
      await connection.query('UPDATE products SET stock = stock - ? WHERE id = ?', [
        row.quantity,
        row.product_id,
      ]);
    }

    const [saleResult] = await connection.query(
      `INSERT INTO sales
         (seller_id, customer_id, customer_name, customer_ci, customer_nit, payment_method, amount_received, change_given, total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user!.id,
        customer_id ?? null,
        String(customer_name).trim(),
        customer_ci ? String(customer_ci).trim() : null,
        customer_nit ? String(customer_nit).trim() : null,
        payment_method,
        finalAmountReceived,
        changeGiven,
        total,
      ],
    );
    const saleId = (saleResult as any).insertId;

    for (const row of rowsToInsert) {
      await connection.query(
        `INSERT INTO sale_items (sale_id, product_id, product_name, product_code, quantity, unit_price, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [saleId, row.product_id, row.product_name, row.product_code, row.quantity, row.unit_price, row.subtotal],
      );
    }

    await connection.commit();

    res.status(201).json({
      id: saleId,
      seller_id: req.user!.id,
      customer_id: customer_id ?? null,
      customer_name: String(customer_name).trim(),
      customer_ci: customer_ci ? String(customer_ci).trim() : null,
      customer_nit: customer_nit ? String(customer_nit).trim() : null,
      payment_method,
      amount_received: finalAmountReceived,
      change_given: changeGiven,
      total,
      created_at: new Date().toISOString(),
      items: rowsToInsert,
    });
  } catch (err: any) {
    await connection.rollback();
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.message });
    }
    throw err;
  } finally {
    connection.release();
  }
});

salesRouter.get('/', async (req, res) => {
  const isAdmin = req.user!.role === 'admin';
  const params: unknown[] = [];
  let query = `
    SELECT s.id, s.seller_id, u.username AS seller_username, s.customer_name, s.customer_ci,
           s.customer_nit, s.payment_method, s.amount_received, s.change_given, s.total, s.created_at
    FROM sales s
    JOIN users u ON u.id = s.seller_id
  `;
  if (!isAdmin) {
    query += ' WHERE s.seller_id = ?';
    params.push(req.user!.id);
  }
  query += ' ORDER BY s.created_at DESC';

  const [salesRows] = await pool.query(query, params);
  const sales = salesRows as any[];
  if (sales.length === 0) {
    return res.json([]);
  }

  const saleIds = sales.map(s => s.id);
  const [itemRows] = await pool.query(
    `SELECT id, sale_id, product_id, product_name, product_code, quantity, unit_price, subtotal
     FROM sale_items WHERE sale_id IN (?) ORDER BY id`,
    [saleIds],
  );
  const itemsBySale = new Map<number, any[]>();
  for (const item of itemRows as any[]) {
    const list = itemsBySale.get(item.sale_id) ?? [];
    list.push(item);
    itemsBySale.set(item.sale_id, list);
  }

  res.json(sales.map(s => ({ ...s, items: itemsBySale.get(s.id) ?? [] })));
});
