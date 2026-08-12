import { Router } from 'express';
import { pool } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';

/**
 * Crea un router CRUD básico (listar + crear) para tablas con forma { id, name },
 * como categories, brands y tematicas.
 */
export function createSimpleCatalogRouter(table: string) {
  const router = Router();
  router.use(requireAuth);

  router.get('/', async (_req, res) => {
    const [rows] = await pool.query(`SELECT id, name FROM ${table} ORDER BY name`);
    res.json(rows);
  });

  router.post('/', requireRole('admin'), async (req, res) => {
    const { name } = req.body ?? {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }
    try {
      const [result] = await pool.query(`INSERT INTO ${table} (name) VALUES (?)`, [
        String(name).trim(),
      ]);
      const insertId = (result as any).insertId;
      res.status(201).json({ id: insertId, name: String(name).trim() });
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Ya existe con ese nombre' });
      }
      throw err;
    }
  });

  return router;
}
