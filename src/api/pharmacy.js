import { apiClient } from './client';

export async function getPharmacyDashboard() {
  const { data } = await apiClient.get('/pharmacy/dashboard');
  return data.data;
}

export async function getExpiringProducts(days = 30) {
  const { data } = await apiClient.get('/pharmacy/expiring-products', {
    params: { days },
  });
  return data.data || [];
}
