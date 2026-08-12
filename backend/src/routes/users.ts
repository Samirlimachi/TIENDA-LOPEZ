import { Router } from 'express';
import { pool } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';

export const usersRouter = Router();

usersRouter.use(requireAuth, requireRole('admin'));

usersRouter.get('/', async (req, res) => {
  // Se excluye al propio admin que hace la consulta: no debe autogestionarse desde esta lista.
  const [rows] = await pool.query(
    `SELECT id, username, email, role, is_approved, is_active, created_at
     FROM users
     WHERE id != ?
     ORDER BY role, created_at DESC`,
    [req.user!.id],
  );
  res.json(rows);
});

usersRouter.patch('/:id/approve', async (req, res) => {
  const [result] = await pool.query(
    "UPDATE users SET is_approved = 1 WHERE id = ? AND role = 'vendedor'",
    [req.params.id],
  );
  if ((result as any).affectedRows === 0) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  res.json({ ok: true });
});

usersRouter.patch('/:id/active', async (req, res) => {
  const { active } = req.body ?? {};
  if (typeof active !== 'boolean') {
    return res.status(400).json({ error: 'El campo active (boolean) es requerido' });
  }
  const [result] = await pool.query(
    "UPDATE users SET is_active = ? WHERE id = ? AND role = 'vendedor'",
    [active, req.params.id],
  );
  if ((result as any).affectedRows === 0) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  res.json({ ok: true });
});

usersRouter.patch('/:id/role', async (req, res) => {
  const { role } = req.body ?? {};
  if (role !== 'admin' && role !== 'vendedor') {
    return res.status(400).json({ error: "role debe ser 'admin' o 'vendedor'" });
  }
  if (Number(req.params.id) === req.user!.id) {
    return res.status(400).json({ error: 'No podés cambiar tu propio rol' });
  }
  const [result] = await pool.query('UPDATE users SET role = ? WHERE id = ?', [
    role,
    req.params.id,
  ]);
  if ((result as any).affectedRows === 0) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  res.json({ ok: true });
});
