import { api } from './api';
import { ManagedUser, Role } from '@models/index';

export const getUsers = async (): Promise<ManagedUser[]> => {
  const { data } = await api.get('/users');
  return data;
};

export const approveUser = async (id: number): Promise<void> => {
  await api.patch(`/users/${id}/approve`);
};

export const setUserActive = async (id: number, active: boolean): Promise<void> => {
  await api.patch(`/users/${id}/active`, { active });
};

export const setUserRole = async (id: number, role: Role): Promise<void> => {
  await api.patch(`/users/${id}/role`, { role });
};
