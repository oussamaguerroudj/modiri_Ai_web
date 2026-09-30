import { apiClient } from './client';

export async function getAppointments() {
  const { data } = await apiClient.get('/appointments');
  return data.data || [];
}

export async function createAppointment(payload) {
  // payload: { customerId, customerName, appointmentDate, serviceType, notes }
  const { data } = await apiClient.post('/appointments', payload);
  return data.data;
}

export async function updateAppointmentStatus(id, status) {
  // status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
  const { data } = await apiClient.put(`/appointments/${id}/status`, { status });
  return data.data;
}
