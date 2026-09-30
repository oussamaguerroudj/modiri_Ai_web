import { apiClient } from './client';

export async function getReportsSummary(params = {}) {
  // params: { from, to }
  const { data } = await apiClient.get('/reports', { params });
  return data.data;
}
