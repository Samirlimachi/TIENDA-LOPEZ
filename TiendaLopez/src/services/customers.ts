import { api } from './api';
import { Customer } from '@models/index';

export const getCustomers = async (): Promise<Customer[]> => {
  const { data } = await api.get('/customers');
  return data;
};

export const createCustomer = async (
  name: string,
  ci?: string | null,
  nit?: string | null,
): Promise<Customer> => {
  const { data } = await api.post('/customers', { name, ci: ci || null, nit: nit || null });
  return data;
};

export const updateCustomer = async (
  id: number,
  name: string,
  ci?: string | null,
  nit?: string | null,
): Promise<Customer> => {
  const { data } = await api.put(`/customers/${id}`, { name, ci: ci || null, nit: nit || null });
  return data;
};
