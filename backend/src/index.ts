import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { createSimpleCatalogRouter } from './routes/simpleCatalog';
import { productsRouter } from './routes/products';
import { usersRouter } from './routes/users';
import { imagesRouter } from './routes/images';
import { salesRouter } from './routes/sales';
import { customersRouter } from './routes/customers';
import { reportsRouter } from './routes/reports';

const app = express();
app.use(cors());
// Las fotos viajan en base64 dentro del JSON del producto, así que el body puede
// pesar varios MB por foto.
app.use(express.json({ limit: '25mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/auth', authRouter);
app.use('/categories', createSimpleCatalogRouter('categories'));
app.use('/brands', createSimpleCatalogRouter('brands'));
app.use('/tematicas', createSimpleCatalogRouter('tematicas'));
app.use('/products', productsRouter);
app.use('/users', usersRouter);
app.use('/images', imagesRouter);
app.use('/sales', salesRouter);
app.use('/customers', customersRouter);
app.use('/reports', reportsRouter);

// Maneja errores no capturados (ej. body demasiado grande) como JSON.
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err) {
    return res.status(400).json({ error: err.message ?? 'Error al procesar la solicitud' });
  }
  return res.status(500).json({ error: 'Error interno' });
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, '0.0.0.0', () => {
  console.log(`API escuchando en http://0.0.0.0:${port}`);
});
