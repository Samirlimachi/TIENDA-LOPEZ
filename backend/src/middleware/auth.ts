import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db';

export type Role = 'admin' | 'vendedor';

export interface AuthPayload {
  id: number;
  username: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no provisto' });
  }
  const token = header.slice('Bearer '.length);
  let payload: AuthPayload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET as string) as AuthPayload;
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }

  // Revalida en cada request: si el admin desactivó o desaprobó la cuenta después
  // de emitido el token, no alcanza con que el JWT siga siendo válido.
  const [rows] = await pool.query(
    'SELECT is_active, is_approved FROM users WHERE id = ?',
    [payload.id],
  );
  const user = (rows as any[])[0];
  if (!user || !user.is_active || !user.is_approved) {
    return res.status(403).json({ error: 'Tu cuenta ya no tiene acceso' });
  }

  req.user = payload;
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tenés permiso para esta acción' });
    }
    next();
  };
}
