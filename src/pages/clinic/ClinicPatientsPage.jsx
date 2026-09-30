import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Phone,
  Calendar,
  FileText,
  Activity,
  Heart,
  X,
  Check,
  UserCheck,
  Eye,
  DollarSign,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  getPatients,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientById,
  recordVisitPayment,
  addClinicDocument,
  deleteClinicDocument,
  downloadClinicDocument,
  getPrescriptions,
  deletePrescription,
} from '../../api/clinic';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { formatMoney } from '../../utils/currency.js';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Alert from '../../components/ui/Alert.jsx';

export default function ClinicPatientsPage() {
  const navigate = useNavigate();
  const { company } = useAuth();
  const { t } = useLanguage();
  const currency = company?.currency || 'DZD';

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Patient Form
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    birthDate: '',
    gender: 'male',
    bloodType: 'A+',
    allergies: '',
    notes: '',
  });

  // Profile View
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentError, setDocumentError] = useState('');
  const [patientPrescriptions, setPatientPrescriptions] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPatients({ search: search || undefined });
      setPatients(data);
    } catch (err) {
      setError(err.message || 'Failed to load clinic patients');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleOpenCreate() {
    setEditingPatient(null);
    setFormData({
      name: '',
      phone: '',
      birthDate: '',
      gender: 'male',
      bloodType: 'A+',
      allergies: '',
      notes: '',
    });
    setModalOpen(true);
  }

  function handleOpenEdit(pat) {
    setEditingPatient(pat);
    let birthDate = '';
    if (pat.birth_date || pat.birthDate || pat.date_of_birth) {
      const d = pat.birth_date || pat.birthDate || pat.date_of_birth;
      birthDate = typeof d === 'string' ? d.slice(0, 10) : '';
    }
    setFormData({
      name: pat.name || pat.full_name || '',
      phone: pat.phone || '',
      birthDate,
      gender: pat.gender || 'male',
      bloodType: pat.blood_type || pat.bloodType || 'A+',
      allergies: pat.allergies || '',
      notes: pat.notes || '',
    });
    setModalOpen(true);
  }

  async function handleDeletePatient(id) {
    if (!window.confirm(t('confirmDelete') || 'Are you sure you want to delete this patient?')) return;
    try {
      await deletePatient(id);
      loadData();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  }

  async function handleSavePatient(e) {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        name: formData.name.trim(),
        fullName: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        birthDate: formData.birthDate || undefined,
        dateOfBirth: formData.birthDate || undefined,
        gender: formData.gender,
        bloodType: formData.bloodType || undefined,
        allergies: formData.allergies.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      };

      if (editingPatient) {
        await updatePatient(editingPatient.id, payload);
      } else {
        await createPatient(payload);
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to save patient');
    } finally {
      setSubmitting(false);
    }
  }

  async function openProfile(patientId) {
    setSelectedPatientId(patientId);
    setProfileData(null);
    setLoadingProfile(true);
    try {
      const [data, prescriptions] = await Promise.all([
        getPatientById(patientId),
        getPrescriptions({ patientId }),
      ]);
      setProfileData(data?.data || data);
      setPatientPrescriptions(prescriptions || []);
      setDocumentError('');
    } catch (err) {
      alert(`Could not load medical file: ${err.message}`);
    } finally {
      setLoadingProfile(false);
    }
  }

  const patientProfile = profileData?.patient || profileData;
  const medicalRecords = profileData?.records || profileData?.medicalRecords || profileData?.visits || patientProfile?.records || patientProfile?.visits || [];
  const patientDocuments = profileData?.documents || profileData?.files || patientProfile?.documents || patientProfile?.files || [];

  async function handleAddDocument(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = form.elements.namedItem('patient-document')?.files?.[0];
    if (!file || !selectedPatientId) return;
    if (file.size > 5 * 1024 * 1024) {
      setDocumentError('Documents must be 5 MB or smaller.');
      return;
    }
    setUploadingDocument(true);
    setDocumentError('');
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Could not read the selected file.'));
        reader.readAsDataURL(file);
      });
      await addClinicDocument({
        patientId: selectedPatientId,
        fileName: documentTitle.trim() || file.name,
        documentType: 'medical_record',
        fileBase64: String(dataUrl).split(',')[1],
        mimeType: file.type || 'application/octet-stream',
      });
      setDocumentTitle('');
      form.reset();
      const data = await getPatientById(selectedPatientId);
      setProfileData(data?.data || data);
    } catch (err) {
      setDocumentError(err.message || 'Could not add the patient document.');
    } finally {
      setUploadingDocument(false);
    }
  }

  async function handleDeleteDocument(id) {
    if (!window.confirm(t('confirmDelete') || 'Delete this patient document?')) return;
    try {
      await deleteClinicDocument(id);
      const data = await getPatientById(selectedPatientId);
      setProfileData(data?.data || data);
    } catch (err) {
      setDocumentError(err.message || 'Could not delete the patient document.');
    }
  }

  async function handleDeletePrescription(prescription) {
    if (!window.confirm(t('confirmDelete') || 'Delete this prescription?')) return;
    try {
      await deletePrescription(prescription.id);
      setPatientPrescriptions((items) => items.filter((item) => item.id !== prescription.id));
    } catch (err) {
      setDocumentError(err.message || 'Could not delete the prescription.');
    }
  }

  async function handleDownloadDocument(doc) {
    try {
      await downloadClinicDocument(doc.id, doc.file_name || doc.title || doc.name || 'patient-document');
    } catch (err) {
      setDocumentError(err.message || 'Could not download the patient document.');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Users className="text-brand-blue" />
            {t('patientDirectory')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t('businessTypeClinicDesc')}
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="btn-primary self-start sm:self-auto py-2.5 px-4 text-sm font-semibold flex items-center gap-2 shadow-lg shadow-brand-blue/20"
        >
          <Plus size={18} /> {t('newPatient')}
        </button>
      </div>

      {error ? <div className="panel border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div> : null}

      {/* Search Bar */}
      <div className="panel p-4">
        <div className="relative w-full max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="input-field pl-10 py-2 text-xs"
          />
        </div>
      </div>

      {/* Patients Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={32} /></div>
      ) : patients.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t('noData')}
          description={t('patientDirectory')}
          action={
            <button onClick={handleOpenCreate} className="btn-primary mt-4 py-2 px-4 text-xs font-semibold">
              <Plus size={16} className="mr-1 inline" /> {t('newPatient')}
            </button>
          }
        />
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-ink-900/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">{t('customer')}</th>
                  <th className="py-3.5 px-4">{t('phone')}</th>
                  <th className="py-3.5 px-4">{t('gender')}</th>
                  <th className="py-3.5 px-4">{t('bloodType')}</th>
                  <th className="py-3.5 px-4">{t('allergies')}</th>
                  <th className="py-3.5 px-4 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-slate-300">
                {patients.map((pat) => (
                  <tr key={pat.id} className="hover:bg-white/5 transition">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-brand-blue/20 text-brand-blue flex items-center justify-center font-bold text-xs">
                          {(pat.name || pat.full_name || 'P')[0]?.toUpperCase() || 'P'}
                        </div>
                        <button type="button" onClick={() => openProfile(pat.id)} className="text-left hover:text-brand-blue transition">
                          {pat.name || pat.full_name}
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-300">
                      {pat.phone ? (
                        <span className="flex items-center gap-1.5">
                          <Phone size={13} className="text-slate-400" />
                          {pat.phone}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs capitalize text-slate-400">
                      {t(pat.gender) || pat.gender || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      {pat.blood_type || pat.bloodType ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                          {pat.blood_type || pat.bloodType}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-amber-300 truncate max-w-xs">
                      {pat.allergies || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openProfile(pat.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                          title={t('details')}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(pat)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10 transition"
                          title={t('edit')}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePatient(pat.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                          title={t('delete')}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Register / Edit Patient Modal */}
      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-line bg-ink-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">
              {editingPatient ? (t('editPatient') || 'Edit Patient') : t('newPatient')}
            </h3>
            <form onSubmit={handleSavePatient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">{t('fullName')} *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('examplePatientName')}
                  className="input-field py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">{t('phone')}</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+213 550..."
                    className="input-field py-2 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">{t('gender')}</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="input-field py-2 text-sm"
                  >
                    <option value="male">{t('male')}</option>
                    <option value="female">{t('female')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">{t('birthDate')}</label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="input-field py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">{t('bloodType')}</label>
                  <select
                    value={formData.bloodType}
                    onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                    className="input-field py-2 text-sm"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">{t('allergies')}</label>
                <input
                  type="text"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder={t('exampleAllergies')}
                  className="input-field py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">{t('notes')}</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={t('notesPlaceholder')}
                  className="input-field py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-line">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost py-2 px-4 text-xs font-semibold">
                  {t('close')}
                </button>
                <button type="submit" disabled={submitting} className="btn-primary py-2 px-5 text-xs font-semibold">
                  {submitting ? <Spinner size={16} /> : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Patient Profile Modal */}
      {selectedPatientId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl border border-line bg-ink-900 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-line pb-4 mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Heart size={20} className="text-red-400" />
                {t('patientDetails')}: {patientProfile?.name || patientProfile?.full_name || 'Patient'}
              </h3>
              <button onClick={() => setSelectedPatientId(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {loadingProfile ? (
              <div className="flex justify-center py-16"><Spinner size={28} /></div>
            ) : profileData ? (
              <div className="space-y-6">
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => { handleOpenEdit(patientProfile); setSelectedPatientId(null); }} className="btn-ghost py-2 px-3 text-xs font-semibold flex items-center gap-1.5">
                    <Pencil size={14} /> {t('edit')}
                  </button>
                  <button type="button" onClick={() => navigate(`/clinic/prescriptions?patientId=${encodeURIComponent(selectedPatientId)}`)} className="btn-primary py-2 px-3 text-xs font-semibold flex items-center gap-1.5">
                    <Plus size={14} /> {t('prescriptions')}
                  </button>
                </div>
                {/* Vitals Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white/5 p-4 rounded-xl border border-line text-xs">
                  <div>
                    <span className="text-slate-400">{t('gender')}:</span>
                    <p className="font-semibold text-white capitalize mt-0.5">{t(patientProfile?.gender) || patientProfile?.gender || '—'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">{t('bloodType')}:</span>
                    <p className="font-mono font-bold text-red-400 mt-0.5">{patientProfile?.blood_type || patientProfile?.bloodType || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">{t('phone')}:</span>
                    <p className="font-mono text-slate-200 mt-0.5">{patientProfile?.phone || '—'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">{t('allergies')}:</span>
                    <p className="font-semibold text-amber-300 mt-0.5 truncate">{patientProfile?.allergies || '—'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">{t('birthDate')}:</span>
                    <p className="font-mono text-slate-200 mt-0.5">{patientProfile?.date_of_birth || patientProfile?.birth_date || patientProfile?.birthDate ? new Date(patientProfile.date_of_birth || patientProfile.birth_date || patientProfile.birthDate).toLocaleDateString(document.documentElement.lang || undefined) : '—'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">{t('email')}:</span>
                    <p className="text-slate-200 mt-0.5 break-all">{patientProfile?.email || '—'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">{t('address')}:</span>
                    <p className="text-slate-200 mt-0.5">{patientProfile?.address || '—'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">{t('outstandingBalance')}</span>
                    <p className="font-mono font-semibold text-amber-300 mt-0.5">{formatMoney(profileData?.outstandingBalance || 0, currency)}</p>
                  </div>
                </div>

                {/* Consultation History */}
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">{t('medicalHistory')}</h4>
                  {medicalRecords.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3">{t('noData')}</p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {medicalRecords.map((rec, i) => (
                        <div key={i} className="p-3 rounded-xl border border-line bg-white/5 text-xs">
                          <div className="flex justify-between font-semibold text-white mb-1">
                            <span>{rec.diagnosis || 'General Consultation'}</span>
                            <span className="text-slate-400 font-mono">{rec.visited_at || rec.created_at || rec.createdAt ? new Date(rec.visited_at || rec.created_at || rec.createdAt).toLocaleDateString(document.documentElement.lang || undefined) : '—'}</span>
                          </div>
                          <p className="text-slate-400">{[rec.reason, rec.symptoms, rec.treatment, rec.notes].filter(Boolean).join(' · ') || '—'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {profileData?.payments?.length ? <section>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">{t('paymentHistory')}</h4>
                  <div className="space-y-2">
                    {profileData.payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between rounded-lg border border-line bg-white/5 p-3 text-xs">
                        <span className="text-slate-300">{payment.method || 'Payment'} · {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString(document.documentElement.lang || undefined) : '—'}</span>
                        <span className={`font-mono font-semibold ${Number(payment.amount) < 0 ? 'text-red-300' : 'text-emerald-300'}`}>{formatMoney(payment.amount, currency)}</span>
                      </div>
                    ))}
                  </div>
                </section> : null}

                <section className="border-t border-line pt-5">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">{t('prescriptions')}</h4>
                  {patientPrescriptions.length ? <div className="space-y-2">
                    {patientPrescriptions.map((prescription) => (
                      <div key={prescription.id} className="rounded-xl border border-line bg-white/5 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs text-slate-400">{prescription.created_at ? new Date(prescription.created_at).toLocaleDateString(document.documentElement.lang || undefined) : '—'}</p>
                            <ul className="mt-1 list-disc pl-4 text-sm text-white">
                              {(prescription.medications || []).map((med, index) => <li key={index}>{med.name} {med.dosage ? `· ${med.dosage}` : ''} {med.frequency ? `· ${med.frequency}` : ''}</li>)}
                            </ul>
                            {prescription.notes ? <p className="mt-1 text-xs text-slate-400">{prescription.notes}</p> : null}
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <button type="button" onClick={() => navigate(`/clinic/prescriptions?patientId=${encodeURIComponent(selectedPatientId)}&prescriptionId=${encodeURIComponent(prescription.id)}`)} className="rounded p-1.5 text-slate-400 hover:bg-white/10 hover:text-white" title={t('edit')}><Pencil size={14} /></button>
                            <button type="button" onClick={() => handleDeletePrescription(prescription)} className="rounded p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400" title={t('delete')}><Trash2 size={14} /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div> : <p className="text-xs text-slate-500">{t('noPatientPrescriptions')}</p>}
                </section>

                <section className="border-t border-line pt-5">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">{t('patientDossier')}</h4>
                  {documentError ? <p role="alert" className="mb-3 text-xs text-red-300">{documentError}</p> : null}
                  <form onSubmit={handleAddDocument} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
                    <label className="text-xs text-slate-400">
                      {t('documentName')}
                      <input value={documentTitle} onChange={(e) => setDocumentTitle(e.target.value)} placeholder={t('exampleLabResults')} className="input-field mt-1 py-2 text-sm" />
                    </label>
                    <label className="text-xs text-slate-400">
                      {t('chooseFile')}
                      <input name="patient-document" type="file" required className="input-field mt-1 py-1.5 text-xs" />
                    </label>
                    <button type="submit" disabled={uploadingDocument} className="btn-primary py-2 px-3 text-xs font-semibold">
                      {uploadingDocument ? <Spinner size={15} /> : 'Add to dossier'}
                    </button>
                  </form>
                  {patientDocuments.length ? (
                    <div className="mt-3 space-y-2">
                      {patientDocuments.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white/5 p-3">
                          <button type="button" onClick={() => handleDownloadDocument(doc)} className="flex min-w-0 items-center gap-2 text-left text-sm text-brand-blue hover:underline">
                            <FileText size={15} /> <span className="truncate">{doc.file_name || doc.title || doc.name || 'Patient document'}</span>
                          </button>
                          <button type="button" onClick={() => handleDeleteDocument(doc.id)} title={t('delete')} className="shrink-0 rounded p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : <p className="mt-3 text-xs text-slate-500">{t('noPatientDocuments')}</p>}
                </section>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
