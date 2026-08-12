import { Router } from 'express';
import { pool } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';

export const productsRouter = Router();

productsRouter.use(requireAuth);

// Calcula el dígito verificador EAN-13 para los primeros 12 dígitos del código.
function ean13CheckDigit(digits12: string): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const d = Number(digits12[i]);
    sum += i % 2 === 0 ? d : d * 3;
  }
  const mod = sum % 10;
  return mod === 0 ? 0 : 10 - mod;
}

const PRODUCT_SELECT = `
  SELECT p.id, p.code, p.name, p.description, p.category_id, c.name AS category_name,
         p.brand_id, b.name AS brand_name,
         p.tematica_id, t.name AS tematica_name,
         p.price, p.price2, p.cost_price, p.stock, p.created_at, p.updated_at
  FROM products p
  JOIN categories c ON c.id = p.category_id
  LEFT JOIN brands b ON b.id = p.brand_id
  LEFT JOIN tematicas t ON t.id = p.tematica_id
`;

interface ImageInput {
  existingId?: number;
  data?: string;
  mime_type?: string;
}

// El costo (cost_price) es información interna: solo el admin lo ve en la respuesta.
function sanitizeForRole(product: any, role: string) {
  if (role === 'admin') {
    return product;
  }
  const { cost_price, ...rest } = product;
  return rest;
}

async function attachImages(products: any[]) {
  if (products.length === 0) {
    return products;
  }
  const ids = products.map(p => p.id);
  const [imageRows] = await pool.query(
    `SELECT id, product_id FROM product_images WHERE product_id IN (?) ORDER BY id`,
    [ids],
  );
  const imagesByProduct = new Map<number, { id: number; url: string }[]>();
  for (const row of imageRows as any[]) {
    const list = imagesByProduct.get(row.product_id) ?? [];
    list.push({ id: row.id, url: `/images/${row.id}` });
    imagesByProduct.set(row.product_id, list);
  }
  return products.map(p => ({ ...p, images: imagesByProduct.get(p.id) ?? [] }));
}

// Conserva las fotos existentes que sigan en la lista (por existingId) y elimina
// las que ya no estén; inserta como filas nuevas (con su binario) las agregadas.
async function replaceImages(productId: number, images: ImageInput[]) {
  const keepIds = images
    .filter(img => img.existingId !== undefined)
    .map(img => img.existingId as number);

  if (keepIds.length > 0) {
    await pool.query('DELETE FROM product_images WHERE product_id = ? AND id NOT IN (?)', [
      productId,
      keepIds,
    ]);
  } else {
    await pool.query('DELETE FROM product_images WHERE product_id = ?', [productId]);
  }

  for (const img of images) {
    if (img.existingId === undefined && img.data) {
      const buffer = Buffer.from(img.data, 'base64');
      await pool.query(
        'INSERT INTO product_images (product_id, data, mime_type) VALUES (?, ?, ?)',
        [productId, buffer, img.mime_type ?? 'image/jpeg'],
      );
    }
  }
}

productsRouter.get('/', async (req, res) => {
  const { category_id } = req.query;
  const params: unknown[] = [];
  let query = PRODUCT_SELECT;
  if (category_id) {
    query += ' WHERE p.category_id = ?';
    params.push(category_id);
  }
  query += ' ORDER BY p.name';
  const [rows] = await pool.query(query, params);
  const withImages = await attachImages(rows as any[]);
  res.json(withImages.map(p => sanitizeForRole(p, req.user!.role)));
});

// Genera el próximo código EAN-13 disponible (para código de barras).
// Prefijo '2' + 11 dígitos correlativos + dígito verificador, siguiendo la convención
// GS1 que reserva el rango 200-299 para uso interno de comercios.
// Debe registrarse antes de "/:id" para no ser interceptada por esa ruta.
productsRouter.get('/next-code', requireRole('admin'), async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT code FROM products WHERE code REGEXP '^2[0-9]{12}$'
     ORDER BY code DESC LIMIT 1`,
  );
  const lastCode = (rows as any[])[0]?.code as string | undefined;
  const lastSeq = lastCode ? BigInt(lastCode.slice(1, 12)) : BigInt(0);
  const base = '2' + (lastSeq + BigInt(1)).toString().padStart(11, '0');
  const code = base + ean13CheckDigit(base);
  res.json({ code });
});

productsRouter.get('/:id', async (req, res) => {
  const [rows] = await pool.query(`${PRODUCT_SELECT} WHERE p.id = ?`, [req.params.id]);
  const product = (rows as any[])[0];
  if (!product) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  const [withImages] = await attachImages([product]);
  res.json(sanitizeForRole(withImages, req.user!.role));
});

productsRouter.post('/', requireRole('admin'), async (req, res) => {
  const {
    code,
    name,
    description,
    category_id,
    brand_id,
    tematica_id,
    images,
    price,
    price2,
    cost_price,
    stock,
  } = req.body ?? {};
  const priceValue = price === undefined || price === null || price === '' ? null : price;
  const price2Value = price2 === undefined || price2 === null || price2 === '' ? null : price2;
  if (!code || !String(code).trim() || !name || !category_id) {
    return res.status(400).json({ error: 'code, name y category_id son requeridos' });
  }
  if (priceValue === null && price2Value === null) {
    return res.status(400).json({ error: 'Ingresá Precio 1 o Precio 2 (al menos uno)' });
  }
  let result;
  try {
    [result] = await pool.query(
      `INSERT INTO products (code, name, description, category_id, brand_id, tematica_id, price, price2, cost_price, stock)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        String(code).trim(),
        name,
        description ?? null,
        category_id,
        brand_id ?? null,
        tematica_id ?? null,
        priceValue,
        price2Value,
        cost_price ?? null,
        stock ?? 0,
      ],
    );
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe un producto con ese código' });
    }
    throw err;
  }
  const insertId = (result as any).insertId;
  if (Array.isArray(images) && images.length > 0) {
    await replaceImages(insertId, images);
  }
  const [rows] = await pool.query(`${PRODUCT_SELECT} WHERE p.id = ?`, [insertId]);
  const [withImages] = await attachImages(rows as any[]);
  res.status(201).json(withImages);
});

productsRouter.put('/:id', requireRole('admin'), async (req, res) => {
  const {
    code,
    name,
    description,
    category_id,
    brand_id,
    tematica_id,
    images,
    price,
    price2,
    cost_price,
    stock,
  } = req.body ?? {};
  const [existingRows] = await pool.query('SELECT id FROM products WHERE id = ?', [
    req.params.id,
  ]);
  if ((existingRows as any[]).length === 0) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  const priceValue = price === undefined || price === null || price === '' ? null : price;
  const price2Value = price2 === undefined || price2 === null || price2 === '' ? null : price2;
  if (priceValue === null && price2Value === null) {
    return res.status(400).json({ error: 'Ingresá Precio 1 o Precio 2 (al menos uno)' });
  }

  try {
    await pool.query(
      `UPDATE products SET
         code = COALESCE(?, code),
         name = COALESCE(?, name),
         description = COALESCE(?, description),
         category_id = COALESCE(?, category_id),
         brand_id = ?,
         tematica_id = ?,
         price = ?,
         price2 = ?,
         cost_price = ?,
         stock = COALESCE(?, stock)
       WHERE id = ?`,
      [
        code ? String(code).trim() : null,
        name,
        description,
        category_id,
        brand_id ?? null,
        tematica_id ?? null,
        priceValue,
        price2Value,
        cost_price ?? null,
        stock,
        req.params.id,
      ],
    );
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe un producto con ese código' });
    }
    throw err;
  }

  if (Array.isArray(images)) {
    await replaceImages(Number(req.params.id), images);
  }

  const [rows] = await pool.query(`${PRODUCT_SELECT} WHERE p.id = ?`, [req.params.id]);
  const [withImages] = await attachImages(rows as any[]);
  res.json(withImages);
});

productsRouter.delete('/:id', requireRole('admin'), async (req, res) => {
  const [result] = await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
  if ((result as any).affectedRows === 0) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  res.status(204).send();
});
