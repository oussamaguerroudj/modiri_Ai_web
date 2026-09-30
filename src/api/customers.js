import { apiClient } from './client';

export async function getCustomers() {
  const { data } = await apiClient.get('/customers');
  return data.data || [];
}

export async function createCustomer(payload) {
  // payload: { name, phone }
  const { data } = await apiClient.post('/customers', payload);
  return data.data;
}

export async function updateCustomer(id, payload) {
  const { data } = await apiClient.put(`/customers/${id}`, payload);
  return data.data;
}

export async function deleteCustomer(id) {
  const { data } = await apiClient.delete(`/customers/${id}`);
  return data.data;
}
