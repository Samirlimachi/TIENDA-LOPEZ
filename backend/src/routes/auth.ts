import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db';
import { AuthPayload } from '../middleware/auth';

export const authRouter = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

authRouter.post('/register', async (req, res) => {
  const { username, email, password } = req.body ?? {};
  if (!username || !String(username).trim() || !email || !password) {
    return res.status(400).json({ error: 'Usuario, correo y contraseña son requeridos' });
  }
  if (!EMAIL_REGEX.test(String(email).trim())) {
    return res.status(400).json({ error: 'El correo no es válido' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  const [existing] = await pool.query(
    'SELECT id FROM users WHERE username = ? OR email = ?',
    [String(username).trim(), String(email).trim()],
  );
  if ((existing as any[]).length > 0) {
    return res.status(409).json({ error: 'Ese usuario o correo ya está registrado' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  // Toda cuenta nueva se crea como vendedor, pendiente de aprobación del admin.
  await pool.query(
    'INSERT INTO users (username, email, password_hash, role, is_approved, is_active) VALUES (?, ?, ?, ?, 0, 1)',
    [String(username).trim(), String(email).trim(), passwordHash, 'vendedor'],
  );

  res.status(201).json({
    message: 'Cuenta creada. Un administrador debe aprobarla antes de que puedas ingresar.',
  });
});

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Correo y contraseña son requeridos' });
  }

  const [rows] = await pool.query(
    'SELECT id, username, password_hash, role, is_approved, is_active FROM users WHERE email = ?',
    [String(email).trim()],
  );
  const user = (rows as any[])[0];
  if (!user) {
    return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
  }

  if (!user.is_active) {
    return res.status(403).json({ error: 'Tu cuenta fue desactivada. Consultá con un administrador.' });
  }
  if (!user.is_approved) {
    return res.status(403).json({ error: 'Tu cuenta todavía no fue aprobada por un administrador.' });
  }

  const payload: AuthPayload = { id: user.id, username: user.username, role: user.role };
  const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '8h') as any,
  });

  res.json({ token, user: payload });
});
