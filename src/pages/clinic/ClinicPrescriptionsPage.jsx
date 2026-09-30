import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  Plus,
  Trash2,
  User,
  Check,
  Pill,
  Pencil,
} from 'lucide-react';
import { createPrescription, getPatients, getPrescriptions, updatePrescription, deletePrescription } from '../../api/clinic';
import { useLanguage } from '../../context/LanguageContext.jsx';
import Spinner from '../../components/ui/Spinner.jsx';

export default function ClinicPrescriptionsPage() {
  const { t, language } = useLanguage();
  const [searchParams] = useSearchParams();
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [notes, setNotes] = useState('');
  const [medications, setMedications] = useState([
    { name: '', dosage: '', frequency: '', duration: '', instructions: '' },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [createdPrescription, setCreatedPrescription] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [editingPrescription, setEditingPrescription] = useState(null);
  const [error, setError] = useState('');

  async function loadPrescriptions(openRequested = true) {
    try {
      const items = await getPrescriptions();
      setPrescriptions(items);
      const requestedId = openRequested ? searchParams.get('prescriptionId') : null;
      const requestedPrescription = items.find((item) => item.id === requestedId);
      if (requestedPrescription) startEditingPrescription(requestedPrescription);
    } catch (err) {
      setError(err.message || 'Could not load prescriptions.');
    }
  }

  useEffect(() => {
    getPatients().then((p) => {
      setPatients(p || []);
      const patientId = searchParams.get('patientId');
      if (patientId) setSelectedPatientId(patientId);
    }).catch(() => {});
    loadPrescriptions();
  }, [searchParams]);

  function addMedicationRow() {
    setMedications([
      ...medications,
      { name: '', dosage: '', frequency: '', duration: '', instructions: '' },
    ]);
  }

  function removeMedicationRow(idx) {
    setMedications(medications.filter((_, i) => i !== idx));
  }

  function updateMedication(idx, field, value) {
    setMedications(
      medications.map((m, i) => (i === idx ? { ...m, [field]: value } : m))
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedPatientId) {
      alert('Please select a patient.');
      return;
    }
    const validMeds = medications.filter((m) => m.name.trim().length > 0);
    if (validMeds.length === 0) {
      alert('Enter at least one medication.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const payload = {
        patientId: selectedPatientId,
        medications: validMeds,
        notes: notes.trim() || undefined,
      };
      if (editingPrescription) {
        const res = await updatePrescription(editingPrescription.id, payload);
        setCreatedPrescription(res);
        setEditingPrescription(null);
      } else {
        const res = await createPrescription(payload);
        setCreatedPrescription(res);
      }
      setNotes('');
      setMedications([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
      await loadPrescriptions(false);
    } catch (err) {
      setError(err.message || 'Failed to save prescription.');
    } finally {
      setSubmitting(false);
    }
  }

  function startEditingPrescription(prescription) {
    setEditingPrescription(prescription);
    setSelectedPatientId(prescription.patient_id || prescription.patientId || '');
    setNotes(prescription.notes || '');
    setMedications(Array.isArray(prescription.medications) && prescription.medications.length
      ? prescription.medications.map((med) => ({ name: '', dosage: '', frequency: '', duration: '', instructions: '', ...med }))
      : [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
    setCreatedPrescription(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDeletePrescription(prescription) {
    if (!window.confirm(t('confirmDelete') || 'Delete this prescription?')) return;
    setError('');
    try {
      await deletePrescription(prescription.id);
      await loadPrescriptions(false);
      if (editingPrescription?.id === prescription.id) {
        setEditingPrescription(null);
        setMedications([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
        setNotes('');
      }
    } catch (err) {
      setError(err.message || 'Could not delete prescription.');
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <FileText className="text-brand-blue" />
          {t('prescriptions')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          {t('businessTypeClinicDesc')}
        </p>
      </div>

      {error ? <div role="alert" className="panel border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div> : null}

      {createdPrescription ? (
        <div className="panel p-6 border-emerald-500/40 bg-emerald-500/10 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Check className="text-emerald-400" /> {t('confirm')}
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              {t('prescriptions')}
            </p>
          </div>
          <button type="button" onClick={() => setCreatedPrescription(null)} className="btn-ghost py-2 px-4 text-xs font-semibold">{t('close')}</button>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="panel p-6 border-line space-y-5">
        {editingPrescription ? <p className="text-xs font-semibold text-brand-blue">{t('editingSavedPrescription')}</p> : null}
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

        {/* Medications List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Pill size={14} className="text-brand-blue" /> {t('medicationsInventory')}
            </h3>
            <button
              type="button"
              onClick={addMedicationRow}
              className="btn-ghost py-1 px-3 text-xs font-semibold flex items-center gap-1"
            >
              <Plus size={13} /> {t('addMedication')}
            </button>
          </div>

          <div className="space-y-3">
            {medications.map((med, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-line bg-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 font-mono">#{idx + 1}</span>
                  {medications.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeMedicationRow(idx)}
                      className="text-slate-400 hover:text-red-400"
                    >
                      <Trash2 size={15} />
                    </button>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={med.name}
                    onChange={(e) => updateMedication(idx, 'name', e.target.value)}
                    placeholder={t('medicationNameExample')}
                    className="input-field py-1.5 text-xs sm:col-span-2"
                  />
                  <input
                    type="text"
                    value={med.dosage}
                    onChange={(e) => updateMedication(idx, 'dosage', e.target.value)}
                    placeholder={t('dosageExample')}
                    className="input-field py-1.5 text-xs"
                  />
                  <input
                    type="text"
                    value={med.frequency}
                    onChange={(e) => updateMedication(idx, 'frequency', e.target.value)}
                    placeholder={t('frequencyExample')}
                    className="input-field py-1.5 text-xs"
                  />
                  <input
                    type="text"
                    value={med.duration}
                    onChange={(e) => updateMedication(idx, 'duration', e.target.value)}
                    placeholder={t('durationExample')}
                    className="input-field py-1.5 text-xs"
                  />
                  <input
                    type="text"
                    value={med.instructions}
                    onChange={(e) => updateMedication(idx, 'instructions', e.target.value)}
                    placeholder={t('instructionsPlaceholder')}
                    className="input-field py-1.5 text-xs sm:col-span-3"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">{t('notes')}</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('specialPrecautions')}
            className="input-field py-2 text-sm resize-none"
          />
        </div>

        <div className="pt-3 border-t border-line flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary py-2.5 px-6 text-xs font-semibold flex items-center gap-2 shadow-lg shadow-brand-blue/20"
          >
            {submitting ? <Spinner size={16} /> : <FileText size={16} />}
            {editingPrescription ? t('update') || 'Update prescription' : t('save')}
          </button>
        </div>
      </form>

      <section className="panel p-6 border-line">
        <h2 className="text-base font-bold text-white mb-4">{t('savedPrescriptions')}</h2>
        {prescriptions.length ? <div className="space-y-2">
          {prescriptions.map((prescription) => (
            <div key={prescription.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white/5 p-3">
              <div>
                <p className="text-sm font-semibold text-white">{prescription.patient_name || prescription.patientName || patients.find((p) => p.id === (prescription.patient_id || prescription.patientId))?.name || patients.find((p) => p.id === (prescription.patient_id || prescription.patientId))?.full_name || 'Patient'}</p>
                <p className="text-xs text-slate-400">{t('medicationCount', { count: Array.isArray(prescription.medications) ? prescription.medications.length : 0 })} · {prescription.created_at ? new Date(prescription.created_at).toLocaleDateString(language) : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => startEditingPrescription(prescription)} className="btn-ghost py-1.5 px-2.5 text-xs"><Pencil size={14} className="inline mr-1" />{t('edit')}</button>
                <button type="button" onClick={() => handleDeletePrescription(prescription)} className="btn-ghost py-1.5 px-2.5 text-xs text-red-300"><Trash2 size={14} className="inline mr-1" />{t('delete')}</button>
              </div>
            </div>
          ))}
        </div> : <p className="text-xs text-slate-400">{t('noSavedPrescriptions')}</p>}
      </section>
    </div>
  );
}
