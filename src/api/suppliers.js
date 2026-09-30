import { apiClient } from './client';

export async function getSuppliers() {
  const { data } = await apiClient.get('/suppliers');
  return data.data || [];
}

export async function createSupplier(payload) {
  // payload: { name, phone }
  const { data } = await apiClient.post('/suppliers', payload);
  return data.data;
}

export async function updateSupplier(id, payload) {
  const { data } = await apiClient.put(`/suppliers/${id}`, payload);
  return data.data;
}

export async function deleteSupplier(id) {
  const { data } = await apiClient.delete(`/suppliers/${id}`);
  return data.data;
}
