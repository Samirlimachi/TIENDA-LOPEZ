import { Router } from 'express';
import { pool } from '../db';
import { requireAuth } from '../middleware/auth';

export const customersRouter = Router();

customersRouter.use(requireAuth);

customersRouter.get('/', async (req, res) => {
  const search = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const params: unknown[] = [];
  let query = 'SELECT id, name, ci, nit FROM customers';
  if (search) {
    query += ' WHERE name LIKE ? OR ci LIKE ? OR nit LIKE ?';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  query += ' ORDER BY name LIMIT 100';
  const [rows] = await pool.query(query, params);
  res.json(rows);
});

customersRouter.post('/', async (req, res) => {
  const { name, ci, nit } = req.body ?? {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Ingresá el nombre del cliente' });
  }
  const [result] = await pool.query('INSERT INTO customers (name, ci, nit) VALUES (?, ?, ?)', [
    String(name).trim(),
    ci ? String(ci).trim() : null,
    nit ? String(nit).trim() : null,
  ]);
  const insertId = (result as any).insertId;
  res.status(201).json({
    id: insertId,
    name: String(name).trim(),
    ci: ci ? String(ci).trim() : null,
    nit: nit ? String(nit).trim() : null,
  });
});

customersRouter.put('/:id', async (req, res) => {
  const { name, ci, nit } = req.body ?? {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Ingresá el nombre del cliente' });
  }
  const [result] = await pool.query('UPDATE customers SET name = ?, ci = ?, nit = ? WHERE id = ?', [
    String(name).trim(),
    ci ? String(ci).trim() : null,
    nit ? String(nit).trim() : null,
    req.params.id,
  ]);
  if ((result as any).affectedRows === 0) {
    return res.status(404).json({ error: 'Cliente no encontrado' });
  }
  res.json({
    id: Number(req.params.id),
    name: String(name).trim(),
    ci: ci ? String(ci).trim() : null,
    nit: nit ? String(nit).trim() : null,
  });
});
