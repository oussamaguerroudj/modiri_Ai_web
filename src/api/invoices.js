import { apiClient } from './client';

export async function getInvoices() {
  const { data } = await apiClient.get('/invoices');
  return data.data || [];
}

export async function getInvoiceById(id) {
  const { data } = await apiClient.get(`/invoices/${id}`);
  return data.data;
}

export async function markInvoicePaid(id) {
  const { data } = await apiClient.put(`/invoices/${id}/mark-paid`);
  return data.data;
}

