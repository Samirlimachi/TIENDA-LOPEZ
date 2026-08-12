import { api } from './api';

export type ReportPeriod = 'today' | 'week' | 'month' | 'all';

export interface PaymentMethodSummary {
  payment_method: 'qr' | 'efectivo';
  count: number;
  total: number;
}

export interface TopProduct {
  product_id: number;
  product_name: string;
  product_code: string;
  quantity: number;
  revenue: number;
}

export interface LowStockProduct {
  id: number;
  code: string;
  name: string;
  stock: number;
  category_name: string;
}

export interface SalesSummary {
  period: ReportPeriod;
  totalSales: number;
  totalRevenue: number;
  totalItemsSold: number;
  byPaymentMethod: PaymentMethodSummary[];
  topProducts: TopProduct[];
  lowStock: LowStockProduct[];
}

export const getSalesSummary = async (period: ReportPeriod): Promise<SalesSummary> => {
  const { data } = await api.get('/reports/summary', { params: { period } });
  return data;
};
