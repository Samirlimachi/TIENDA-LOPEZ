import { api } from './api';
import { PaymentMethod, Sale } from '@models/index';

export interface SaleItemInput {
  product_id: number;
  quantity: number;
  price_type: 'price' | 'price2';
}

export interface CreateSaleInput {
  items: SaleItemInput[];
  customer_id?: number | null;
  customer_name: string;
  customer_ci?: string | null;
  customer_nit?: string | null;
  payment_method: PaymentMethod;
  amount_received?: number;
}

export const createSale = async (input: CreateSaleInput): Promise<Sale> => {
  const { data } = await api.post('/sales', input);
  return data;
};

export const getSales = async (): Promise<Sale[]> => {
  const { data } = await api.get('/sales');
  return data;
};
