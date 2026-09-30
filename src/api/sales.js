import { apiClient } from './client';

export async function getSales() {
  const { data } = await apiClient.get('/sales');
  return data.data || [];
}

export async function getSaleById(id) {
  const { data } = await apiClient.get(`/sales/${id}`);
  return data.data;
}

export async function createSale(payload) {
  // payload: { items: [{ productId, quantity, unitPrice }], customerId, paymentMethod, discount, notes }
  const { data } = await apiClient.post('/sales', payload);
  return data.data;
}
