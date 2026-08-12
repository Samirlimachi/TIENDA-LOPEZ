import { api } from './api';
import { Brand, Category, Product, Tematica } from '@models/index';

export const getCategories = async (): Promise<Category[]> => {
  const { data } = await api.get('/categories');
  return data;
};

export const createCategory = async (name: string): Promise<Category> => {
  const { data } = await api.post('/categories', { name });
  return data;
};

export const getBrands = async (): Promise<Brand[]> => {
  const { data } = await api.get('/brands');
  return data;
};

export const createBrand = async (name: string): Promise<Brand> => {
  const { data } = await api.post('/brands', { name });
  return data;
};

export const getTematicas = async (): Promise<Tematica[]> => {
  const { data } = await api.get('/tematicas');
  return data;
};

export const createTematica = async (name: string): Promise<Tematica> => {
  const { data } = await api.post('/tematicas', { name });
  return data;
};

export const getProducts = async (categoryId?: number): Promise<Product[]> => {
  const { data } = await api.get('/products', {
    params: categoryId ? { category_id: categoryId } : undefined,
  });
  return data;
};

export const getNextProductCode = async (): Promise<string> => {
  const { data } = await api.get('/products/next-code');
  return data.code;
};

export type ProductImageInput =
  | { existingId: number }
  | { data: string; mime_type: string };

export interface ProductInput {
  code: string;
  name: string;
  description?: string;
  category_id: number;
  brand_id?: number | null;
  tematica_id?: number | null;
  images?: ProductImageInput[];
  price?: number | null;
  price2?: number | null;
  cost_price?: number | null;
  stock: number;
}

export const createProduct = async (input: ProductInput): Promise<Product> => {
  const { data } = await api.post('/products', input);
  return data;
};

export const updateProduct = async (
  id: number,
  input: Partial<ProductInput>,
): Promise<Product> => {
  const { data } = await api.put(`/products/${id}`, input);
  return data;
};

export const deleteProduct = async (id: number): Promise<void> => {
  await api.delete(`/products/${id}`);
};
