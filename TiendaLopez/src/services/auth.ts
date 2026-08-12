import { api } from './api';

export const register = async (
  username: string,
  email: string,
  password: string,
): Promise<string> => {
  const { data } = await api.post('/auth/register', { username, email, password });
  return data.message as string;
};
