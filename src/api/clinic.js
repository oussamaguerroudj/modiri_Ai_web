import { apiClient, API_BASE_URL } from './client';

// Dashboard
export async function getClinicDashboard() {
  const { data } = await apiClient.get('/clinic/dashboard');
  return data.data;
}

// Patients
export async function getPatients(params = {}) {
  const { data } = await apiClient.get('/clinic/patients', { params });
  return data.data || [];
}

export async function getPatientById(id) {
  const { data } = await apiClient.get(`/clinic/patients/${id}`);
  return data.data;
}

export async function createPatient(payload) {
  const fullName = (payload.fullName || payload.name || '').trim();
  const { data } = await apiClient.post('/clinic/patients', {
    ...payload,
    fullName,
    name: fullName,
  });
  return data.data;
}

export async function updatePatient(id, payload) {
  const fullName = (payload.fullName || payload.name || '').trim();
  const { data } = await apiClient.put(`/clinic/patients/${id}`, {
    ...payload,
    fullName,
    name: fullName,
  });
  return data.data;
}

export async function deletePatient(id) {
  const { data } = await apiClient.delete(`/clinic/patients/${id}`);
  return data;
}

// Queue / Waiting Room
export async function getQueue() {
  const { data } = await apiClient.get('/clinic/queue');
  return data.data; // { queue: [...], nextPatient: ... }
}

export async function addToQueue(payload) {
  // payload: { patientId, visitType }
  const { data } = await apiClient.post('/clinic/queue', payload);
  return data.data;
}

export async function callNextPatient() {
  const { data } = await apiClient.post('/clinic/queue/call-next');
  return data.data;
}

export async function completeConsultation(queueId, payload) {
  // payload: { diagnosis, notes, prescriptionItems, fee }
  const { data } = await apiClient.post(`/clinic/queue/${queueId}/complete`, payload);
  return data.data;
}

export async function cancelQueueEntry(queueId) {
  const { data } = await apiClient.post(`/clinic/queue/${queueId}/cancel`);
  return data.data;
}

// Prescriptions
export async function createPrescription(payload) {
  // payload: { patientId, medications: [{ name, dosage, frequency, duration, instructions }], notes }
  const { data } = await apiClient.post('/clinic/prescriptions', payload);
  return data.data;
}

export async function getPrescriptions(params = {}) {
  const { data } = await apiClient.get('/clinic/prescriptions', { params });
  return data.data || [];
}

export async function updatePrescription(id, payload) {
  const { data } = await apiClient.put(`/clinic/prescriptions/${id}`, payload);
  return data.data;
}

export async function deletePrescription(id) {
  const { data } = await apiClient.delete(`/clinic/prescriptions/${id}`);
  return data.data;
}

export async function getPrescription(id) {
  const { data } = await apiClient.get(`/clinic/prescriptions/${id}`);
  return data.data;
}

export function getPrescriptionPdfUrl(id) {
  return `${API_BASE_URL}/clinic/prescriptions/${id}/pdf`;
}

// Documents
export async function addClinicDocument(payload) {
  // payload: { patientId, fileName, documentType, fileBase64, mimeType }
  const { data } = await apiClient.post('/clinic/documents', payload);
  return data.data;
}

export async function deleteClinicDocument(id) {
  const { data } = await apiClient.delete(`/clinic/documents/${id}`);
  return data.data;
}

export function getClinicDocumentFileUrl(id) {
  return `${API_BASE_URL}/clinic/documents/${id}/file`;
}

export async function downloadClinicDocument(id, filename = 'patient-document') {
  const response = await apiClient.get(`/clinic/documents/${id}/file`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}

// Visits Payments
export async function recordVisitPayment(visitId, payload) {
  // payload: { amount, method, note }
  const { data } = await apiClient.post(`/clinic/visits/${visitId}/payments`, payload);
  return data.data;
}

export async function refundVisit(visitId, payload = {}) {
  const { data } = await apiClient.post(`/clinic/visits/${visitId}/refund`, payload);
  return data.data;
}

export async function getVisitInvoice(visitId) {
  const { data } = await apiClient.get(`/clinic/visits/${visitId}/invoice`);
  return data.data;
}
