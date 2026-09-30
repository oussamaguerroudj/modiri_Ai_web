import { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Plus,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Check,
} from 'lucide-react';
import {
  getAppointments,
  createAppointment,
  updateAppointmentStatus,
} from '../../api/appointments';
import { getCustomers } from '../../api/customers';
import { useLanguage } from '../../context/LanguageContext.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Alert from '../../components/ui/Alert.jsx';

export default function AppointmentsPage() {
  const { t } = useLanguage();
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    appointmentDate: new Date().toISOString().slice(0, 16),
    serviceType: '',
    notes: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [appts, custs] = await Promise.all([getAppointments(), getCustomers()]);
      setAppointments(appts);
      setCustomers(custs);
    } catch (err) {
      setError(err.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleStatusChange(id, status) {
    try {
      await updateAppointmentStatus(id, status);
      loadData();
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.customerName.trim() && !formData.customerId) {
      setError('Customer is required.');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      await createAppointment({
        customerId: formData.customerId || undefined,
        customerName: formData.customerName.trim() || undefined,
        appointmentDate: formData.appointmentDate,
        serviceType: formData.serviceType.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      });
      setModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to schedule appointment');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Calendar className="text-brand-blue" />
            {t('moreAppointments')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t('businessTypeClinicDesc')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setFormData({
              customerId: '',
              customerName: '',
              appointmentDate: new Date().toISOString().slice(0, 16),
              serviceType: '',
              notes: '',
            });
            setError('');
            setModalOpen(true);
          }}
          className="btn-primary self-start sm:self-auto py-2.5 px-4 text-sm font-semibold flex items-center gap-2 shadow-lg shadow-brand-blue/20"
        >
          <Plus size={18} />
          {t('moreAppointments')}
        </button>
      </div>

      {error ? <div className="panel border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div> : null}

      {/* Appointments List */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={32} /></div>
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={t('noData')}
          description={t('moreAppointments')}
          action={
            <button onClick={() => setModalOpen(true)} className="btn-primary mt-4 py-2 px-4 text-xs font-semibold">
              <Plus size={16} className="mr-1 inline" /> {t('moreAppointments')}
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
                  <th className="py-3.5 px-4">{t('category')}</th>
                  <th className="py-3.5 px-4">{t('date')}</th>
                  <th className="py-3.5 px-4">{t('status')}</th>
                  <th className="py-3.5 px-4">{t('notes')}</th>
                  <th className="py-3.5 px-4 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-slate-300">
                {appointments.map((appt) => {
                  const status = appt.status || 'scheduled';
                  return (
                    <tr key={appt.id} className="hover:bg-white/5 transition">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <User size={15} className="text-brand-blue" />
                          <span>{appt.customer_name || appt.customerName || t('customer')}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-300">
                        {appt.service_type || appt.serviceType || 'Consultation'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-300 font-mono">
                        {appt.appointment_date ? new Date(appt.appointment_date).toLocaleString(document.documentElement.lang || undefined) : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : status === 'cancelled'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : status === 'confirmed'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {t(status) || status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400 truncate max-w-xs">
                        {appt.notes || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {status !== 'completed' && status !== 'cancelled' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(appt.id, 'completed')}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                                title={t('confirm')}
                              >
                                <CheckCircle size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(appt.id, 'cancelled')}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                                title={t('cancelled')}
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Book Appointment Modal */}
      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-line bg-ink-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar size={18} className="text-brand-blue" />
                {t('moreAppointments')}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <Alert>{error}</Alert>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  {t('customer')}
                </label>
                <select
                  value={formData.customerId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const cust = customers.find((c) => c.id === id);
                    setFormData({
                      ...formData,
                      customerId: id,
                      customerName: cust ? cust.name : formData.customerName,
                    });
                  }}
                  className="input-field py-2 text-sm"
                >
                  <option value="">{t('searchPlaceholder')}</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id} className="bg-ink-900 text-white">
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  {t('fullName')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder={t('examplePatientName')}
                  className="input-field py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  {t('date')} *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.appointmentDate}
                  onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                  className="input-field py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  {t('category')}
                </label>
                <input
                  type="text"
                  value={formData.serviceType}
                  onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                  placeholder={t('exampleConsultation')}
                  className="input-field py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  {t('notes')}
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={t('notesPlaceholder')}
                  className="input-field py-2 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-ghost py-2 px-4 text-xs font-semibold"
                >
                  {t('close')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary py-2 px-5 text-xs font-semibold flex items-center gap-1.5"
                >
                  {submitting ? <Spinner size={16} /> : <Check size={16} />}
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
