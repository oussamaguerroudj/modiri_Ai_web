import { apiClient } from './client';

export async function getExpenses() {
  const { data } = await apiClient.get('/expenses');
  return {
    expenses: Array.isArray(data.data) ? data.data : data.data?.expenses || [],
    thisMonthTotal: data.data?.thisMonthTotal ?? data.thisMonthTotal,
  };
}

export async function createExpense(payload) {
  // payload: { category, description, amount, expenseDate, period }
  const { data } = await apiClient.post('/expenses', payload);
  return data.data;
}

export async function updateExpense(id, payload) {
  const { data } = await apiClient.put(`/expenses/${id}`, payload);
  return data.data;
}

export async function deleteExpense(id) {
  const { data } = await apiClient.delete(`/expenses/${id}`);
  return data.data;
}
