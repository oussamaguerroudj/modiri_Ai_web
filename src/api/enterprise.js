import { apiClient } from './client';

export async function getEnterpriseDashboard() {
  const { data } = await apiClient.get('/enterprise/dashboard');
  return data.data;
}

export async function getEnterpriseProjects() {
  const { data } = await apiClient.get('/enterprise/projects');
  return data.data || [];
}

export async function createEnterpriseProject(payload) {
  // payload: { name, clientName, budget, startDate, endDate, notes }
  const { data } = await apiClient.post('/enterprise/projects', payload);
  return data.data;
}

export async function updateEnterpriseProjectStatus(id, status) {
  // status: 'planned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'
  const { data } = await apiClient.patch(`/enterprise/projects/${id}/status`, { status });
  return data.data;
}
