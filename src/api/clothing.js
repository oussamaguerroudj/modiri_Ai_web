import { apiClient } from './client';

export async function getClothingDashboard() {
  const { data } = await apiClient.get('/clothing/dashboard');
  return data.data;
}
