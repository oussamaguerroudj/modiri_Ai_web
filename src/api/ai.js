import { apiClient } from './client';

export async function sendAiChat({ message, history = [] }) {
  const { data } = await apiClient.post('/ai/chat', { message, history });
  return data.data; // { reply }
}

export async function scanInvoice({ imageBase64, mimeType = 'image/jpeg' }) {
  const { data } = await apiClient.post(
    '/ai/invoices/scan',
    { imageBase64, mimeType },
    { timeout: 90000 }
  );
  return data.data; // { logId, items: [...] }
}

export async function confirmScannedInvoice(logId, payload = {}) {
  const { data } = await apiClient.post(`/ai/invoices/scan/${logId}/confirm`, payload);
  return data.data;
}

export async function getAiInsights() {
  const { data } = await apiClient.get('/ai/insights');
  return data.data;
}

export async function sendAiFeedback(logId, payload) {
  // payload: { rating, comment }
  const { data } = await apiClient.post(`/ai/logs/${logId}/feedback`, payload);
  return data.data;
}
