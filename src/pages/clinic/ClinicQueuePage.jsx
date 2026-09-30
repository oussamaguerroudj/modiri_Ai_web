import { useState, useEffect, useCallback } from 'react';
import {
  UserCheck,
  Plus,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Stethoscope,
  X,
  Check,
  FileCheck,
} from 'lucide-react';
import {
  getQueue,
  addToQueue,
  callNextPatient,
  completeConsultation,
  cancelQueueEntry,
  getPatients,
} from '../../api/clinic';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { formatMoney } from '../../utils/currency.js';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Alert from '../../components/ui/Alert.jsx';

export default function ClinicQueuePage() {
  const { company } = useAuth();
  const { t } = useLanguage();
  const currency = company?.currency || 'DZD';

  const [queue, setQueue] = useState([]);
  const [nextPatient, setNextPatient] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [callingNext, setCallingNext] = useState(false);
  const [error, setError] = useState('');

  // Add to queue modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [visitType, setVisitType] = useState('Consultation');

  // Complete consultation modal
  const [completeModalEntry, setCompleteModalEntry] = useState(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [consultationFee, setConsultationFee] = useState('2000');
  const [consultationNotes, setConsultationNotes] = useState('');
  const [submittingComplete, setSubmittingComplete] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [qData, patData] = await Promise.all([getQueue(), getPatients()]);
      setQueue(qData?.queue || []);
      setNextPatient(qData?.nextPatient || null);
      setPatients(patData);
    } catch (err) {
      setError(err.message || 'Failed to load clinic waiting queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCallNext() {
    setCallingNext(true);
    try {
      await callNextPatient();
      loadData();
    } catch (err) {
      alert(`Error calling next patient: ${err.message}`);
    } finally {
      setCallingNext(false);
    }
  }

  async function handleAddToQueue(e) {
    e.preventDefault();
    if (!selectedPatientId) return;
    try {
      await addToQueue({
        patientId: selectedPatientId,
        visitType,
      });
      setAddModalOpen(false);
      setSelectedPatientId('');
      loadData();
    } catch (err) {
      alert(`Could not add to queue: ${err.message}`);
    }
  }

  async function handleCompleteSubmit(e) {
    e.preventDefault();
    if (!completeModalEntry) return;
    setSubmittingComplete(true);
    try {
      await completeConsultation(completeModalEntry.id, {
        diagnosis: diagnosis.trim() || 'General Consultation',
        notes: consultationNotes.trim() || undefined,
        fee: Number(consultationFee) || 0,
      });
      setCompleteModalEntry(null);
      setDiagnosis('');
      setConsultationNotes('');
      loadData();
    } catch (err) {
      alert(`Failed to complete visit: ${err.message}`);
    } finally {
      setSubmittingComplete(false);
    }
  }

  async function handleCancel(entry) {
    if (!confirm(`Cancel queue position for ${entry.patient_name || entry.name}?`)) return;
    try {
      await cancelQueueEntry(entry.id);
      loadData();
    } catch (err) {
      alert(`Cancel failed: ${err.message}`);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <UserCheck className="text-brand-blue" />
            {t('waitingRoomQueue')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t('businessTypeClinicDesc')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={callingNext || queue.length === 0}
            onClick={handleCallNext}
            className="btn-primary py-2.5 px-4 text-xs font-semibold flex items-center gap-2 shadow-lg shadow-brand-blue/20"
          >
            {callingNext ? <Spinner size={14} /> : <UserCheck size={16} />}
            {t('callNextPatient')}
          </button>
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="btn-ghost py-2.5 px-4 text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus size={16} /> {t('newPatient')}
          </button>
        </div>
      </div>

      {error ? <div className="panel border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div> : null}

      {/* Next Up Hero Card */}
      {nextPatient ? (
        <div className="panel p-6 border-brand-blue/40 bg-gradient-to-r from-brand-blue/15 via-ink-800 to-ink-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="h-14 w-14 rounded-2xl bg-brand-blue text-white flex items-center justify-center font-bold text-xl shadow-glow">
              #1
            </span>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-blue">
                {t('nextInLine')}
              </span>
              <h2 className="text-xl font-bold text-white mt-0.5">
                {nextPatient.patient_name || nextPatient.name}
              </h2>
              <p className="text-xs text-slate-400">
                {nextPatient.visit_type || 'General Consultation'} · {t('bloodType')}: {nextPatient.blood_type || 'N/A'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCompleteModalEntry(nextPatient)}
            className="btn-primary py-2.5 px-5 text-xs font-semibold flex items-center gap-2 self-start sm:self-center"
          >
            <FileCheck size={16} /> {t('confirm')}
          </button>
        </div>
      ) : null}

      {/* Queue List Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={32} /></div>
      ) : queue.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title={t('noPatientWaiting')}
          description={t('waitingRoomQueue')}
          action={
            <button onClick={() => setAddModalOpen(true)} className="btn-primary mt-4 py-2 px-4 text-xs font-semibold">
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
                  <th className="py-3.5 px-4 text-center w-16">#</th>
                  <th className="py-3.5 px-4">{t('customer')}</th>
                  <th className="py-3.5 px-4">{t('category')}</th>
                  <th className="py-3.5 px-4">{t('date')}</th>
                  <th className="py-3.5 px-4 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-slate-300">
                {queue.map((entry, idx) => (
                  <tr key={entry.id} className="hover:bg-white/5 transition">
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-brand-blue">
                      #{idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {entry.patient_name || entry.name}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      {entry.visit_type || 'Consultation'}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-400">
                      {entry.created_at ? new Date(entry.created_at).toLocaleTimeString() : 'Recent'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setCompleteModalEntry(entry)}
                          className="btn-primary py-1 px-3 text-xs font-semibold"
                        >
                          {t('confirm')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancel(entry)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                          title={t('cancelled')}
                        >
                          <XCircle size={16} />
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

      {/* Check In Patient Modal */}
      {addModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-line bg-ink-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">{t('newPatient')}</h3>
            <form onSubmit={handleAddToQueue} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">{t('customer')} *</label>
                <select
                  required
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="input-field py-2 text-sm cursor-pointer"
                >
                  <option value="">{t('searchPlaceholder')}</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id} className="bg-ink-900 text-white">
                      {p.name} {p.phone ? `(${p.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">{t('category')}</label>
                <input
                  type="text"
                  value={visitType}
                  onChange={(e) => setVisitType(e.target.value)}
                  placeholder={t('exampleConsultation')}
                  className="input-field py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-line">
                <button type="button" onClick={() => setAddModalOpen(false)} className="btn-ghost py-2 px-4 text-xs font-semibold">
                  {t('close')}
                </button>
                <button type="submit" className="btn-primary py-2 px-5 text-xs font-semibold">
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Complete Consultation Modal */}
      {completeModalEntry ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-line bg-ink-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">
              {t('confirm')} — {completeModalEntry.patient_name || completeModalEntry.name}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {t('diagnosis')} & {t('consultationFee')}
            </p>

            <form onSubmit={handleCompleteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">{t('diagnosis')} *</label>
                <input
                  type="text"
                  required
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder={t('exampleDiagnosis')}
                  className="input-field py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  {t('consultationFee')} ({currency}) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(e.target.value)}
                  className="input-field py-2 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">{t('notes')}</label>
                <textarea
                  rows={3}
                  value={consultationNotes}
                  onChange={(e) => setConsultationNotes(e.target.value)}
                  placeholder={t('notesPlaceholder')}
                  className="input-field py-2 text-sm resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-line">
                <button type="button" onClick={() => setCompleteModalEntry(null)} className="btn-ghost py-2 px-4 text-xs font-semibold">
                  {t('close')}
                </button>
                <button type="submit" disabled={submittingComplete} className="btn-primary py-2 px-5 text-xs font-semibold flex items-center gap-1.5">
                  {submittingComplete ? <Spinner size={16} /> : <Check size={16} />}
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
