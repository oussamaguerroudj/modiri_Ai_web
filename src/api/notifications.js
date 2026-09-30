import { apiClient } from './client';

export async function getNotifications() {
  const { data } = await apiClient.get('/notifications');
  return data.data || [];
}

export async function markNotificationRead(id) {
  const { data } = await apiClient.put(`/notifications/${id}/read`);
  return data.data;
}
