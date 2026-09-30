import { apiClient } from './client';

export async function getCreditSummary() {
  const { data } = await apiClient.get('/credit/summary');
  return data.data;
}

export async function getCreditPurchases() {
  const { data } = await apiClient.get('/credit/purchases');
  return data.data || [];
}

export async function createCreditPurchase(payload) {
  // payload: { customerId, items: [...], totalAmount, notes }
  const { data } = await apiClient.post('/credit/purchases', payload);
  return data.data;
}

export async function recordCreditPayment(payload) {
  // payload: { customerId, amount, paymentMethod, note }
  const { data } = await apiClient.post('/credit/payments', payload);
  return data.data;
}

export async function getCustomerCreditTransactions(customerId) {
  const { data } = await apiClient.get(`/credit/customers/${customerId}/transactions`);
  return data.data || [];
}
