export type Role = 'admin' | 'vendedor';

export interface AuthUser {
  id: number;
  username: string;
  role: Role;
}

export interface ManagedUser {
  id: number;
  username: string;
  email: string | null;
  role: Role;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface Brand {
  id: number;
  name: string;
}

export interface Tematica {
  id: number;
  name: string;
}

export interface ProductImage {
  id: number;
  url: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number | null;
  product_name: string;
  product_code: string;
  quantity: number;
  unit_price: string | number;
  subtotal: string | number;
}

export type PaymentMethod = 'qr' | 'efectivo';

export interface Customer {
  id: number;
  name: string;
  ci: string | null;
  nit: string | null;
}

export interface Sale {
  id: number;
  seller_id: number;
  seller_username?: string;
  customer_id?: number | null;
  customer_name: string;
  customer_ci: string | null;
  customer_nit: string | null;
  payment_method: PaymentMethod;
  amount_received: string | number;
  change_given: string | number;
  total: string | number;
  created_at: string;
  items: SaleItem[];
}

export interface Product {
  id: number;
  code: string;
  name: string;
  description: string | null;
  category_id: number;
  category_name: string;
  brand_id: number | null;
  brand_name: string | null;
  tematica_id: number | null;
  tematica_name: string | null;
  images: ProductImage[];
  price: string | null;
  price2: string | null;
  cost_price?: string | null;
  stock: number;
  created_at: string;
  updated_at: string;
}
