import { apiClient } from './client';

export async function getSuperetteDashboard() {
  const { data } = await apiClient.get('/superette/dashboard');
  return data.data;
}
