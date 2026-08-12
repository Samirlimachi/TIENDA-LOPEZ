import { Router } from 'express';
import { pool } from '../db';

export const imagesRouter = Router();

// Público (sin requireAuth) para que <Image> pueda pedirla directo por URL,
// igual que antes cuando eran archivos estáticos servidos sin autenticación.
imagesRouter.get('/:id', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT data, mime_type FROM product_images WHERE id = ?',
    [req.params.id],
  );
  const image = (rows as any[])[0];
  if (!image) {
    return res.status(404).json({ error: 'Imagen no encontrada' });
  }
  res.set('Content-Type', image.mime_type);
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.send(image.data);
});