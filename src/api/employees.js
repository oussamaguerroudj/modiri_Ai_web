import { apiClient } from './client';

export async function getEmployees() {
  const { data } = await apiClient.get('/employees');
  return data.data || [];
}

export async function getEmployeeById(id) {
  const { data } = await apiClient.get(`/employees/${id}`);
  return data.data;
}

export async function createEmployee(payload) {
  // payload: { name, position, baseSalary }
  const { data } = await apiClient.post('/employees', payload);
  return data.data;
}

export async function updateEmployee(id, payload) {
  const { data } = await apiClient.put(`/employees/${id}`, payload);
  return data.data;
}

export async function deleteEmployee(id) {
  const { data } = await apiClient.delete(`/employees/${id}`);
  return data.data;
}

export async function markAttendance(employeeId, status) {
  // status: 'present' | 'absent' | 'late' | 'half_day'
  const { data } = await apiClient.post(`/employees/${employeeId}/attendance`, { status });
  return data.data;
}

export async function addSalaryAdjustment(employeeId, payload) {
  // payload: { type: 'bonus' | 'deduction', amount, note }
  const { data } = await apiClient.post(`/employees/${employeeId}/salary-adjustments`, payload);
  return data.data;
}
