import { Router } from 'express';
import { pool } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';

export const reportsRouter = Router();

reportsRouter.use(requireAuth);
reportsRouter.use(requireRole('admin'));

type Period = 'today' | 'week' | 'month' | 'all';

// Condiciones fijas (no interpolan input del usuario) para evitar SQL injection.
const PERIOD_CONDITIONS: Record<Period, string> = {
  today: 'DATE(s.created_at) = CURDATE()',
  week: 'YEARWEEK(s.created_at, 1) = YEARWEEK(CURDATE(), 1)',
  month: 'YEAR(s.created_at) = YEAR(CURDATE()) AND MONTH(s.created_at) = MONTH(CURDATE())',
  all: '1 = 1',
};

reportsRouter.get('/summary', async (req, res) => {
  const periodParam = req.query.period;
  const period: Period =
    typeof periodParam === 'string' && periodParam in PERIOD_CONDITIONS
      ? (periodParam as Period)
      : 'month';
  const condition = PERIOD_CONDITIONS[period];

  const [totalsRows] = await pool.query(
    `SELECT COUNT(*) AS totalSales, COALESCE(SUM(total), 0) AS totalRevenue
     FROM sales s WHERE ${condition}`,
  );
  const totals = (totalsRows as any[])[0];

  const [itemsRows] = await pool.query(
    `SELECT COALESCE(SUM(si.quantity), 0) AS totalItemsSold
     FROM sale_items si JOIN sales s ON s.id = si.sale_id
     WHERE ${condition}`,
  );
  const itemsTotals = (itemsRows as any[])[0];

  const [byPaymentMethod] = await pool.query(
    `SELECT payment_method, COUNT(*) AS count, COALESCE(SUM(total), 0) AS total
     FROM sales s
     WHERE ${condition}
     GROUP BY payment_method`,
  );

  const [topProducts] = await pool.query(
    `SELECT si.product_id, si.product_name, si.product_code,
            SUM(si.quantity) AS quantity, SUM(si.subtotal) AS revenue
     FROM sale_items si JOIN sales s ON s.id = si.sale_id
     WHERE ${condition}
     GROUP BY si.product_id, si.product_name, si.product_code
     ORDER BY quantity DESC
     LIMIT 10`,
  );

  const lowStockThreshold = Number(req.query.lowStockThreshold) || 5;
  const [lowStock] = await pool.query(
    `SELECT p.id, p.code, p.name, p.stock, c.name AS category_name
     FROM products p JOIN categories c ON c.id = p.category_id
     WHERE p.stock <= ?
     ORDER BY p.stock ASC
     LIMIT 20`,
    [lowStockThreshold],
  );

  res.json({
    period,
    totalSales: Number(totals.totalSales),
    totalRevenue: Number(totals.totalRevenue),
    totalItemsSold: Number(itemsTotals.totalItemsSold),
    byPaymentMethod,
    topProducts,
    lowStock,
  });
});
