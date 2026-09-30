import { useState, useEffect, useCallback } from 'react';
import {
  FolderKanban,
  Plus,
  Building2,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Check,
} from 'lucide-react';
import {
  getEnterpriseProjects,
  createEnterpriseProject,
  updateEnterpriseProjectStatus,
} from '../../api/enterprise';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { formatMoney } from '../../utils/currency.js';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Alert from '../../components/ui/Alert.jsx';

export default function EnterpriseProjectsPage() {
  const { company } = useAuth();
  const { t } = useLanguage();
  const currency = company?.currency || 'DZD';

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    clientName: '',
    budget: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    notes: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEnterpriseProjects();
      setProjects(data);
    } catch (err) {
      setError(err.message || 'Failed to load enterprise projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleStatusChange(id, status) {
    try {
      await updateEnterpriseProjectStatus(id, status);
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status } : p))
      );
    } catch (err) {
      alert(`Could not update status: ${err.message}`);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.name.trim() || !formData.budget) return;
    setSubmitting(true);
    setError('');

    try {
      await createEnterpriseProject({
        name: formData.name.trim(),
        clientName: formData.clientName.trim() || undefined,
        budget: Number(formData.budget) || 0,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        notes: formData.notes.trim() || undefined,
      });
      setModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to create project');
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
            <FolderKanban className="text-brand-blue" />
            {t('manageProjects')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t('businessTypeCompanyDesc')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setFormData({
              name: '',
              clientName: '',
              budget: '',
              startDate: new Date().toISOString().split('T')[0],
              endDate: '',
              notes: '',
            });
            setModalOpen(true);
          }}
          className="btn-primary self-start sm:self-auto py-2.5 px-4 text-sm font-semibold flex items-center gap-2 shadow-lg shadow-brand-blue/20"
        >
          <Plus size={18} /> {t('newProject')}
        </button>
      </div>

      {error ? <div className="panel border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div> : null}

      {/* Projects Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={32} /></div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={t('noData')}
          description={t('manageProjects')}
          action={
            <button onClick={() => setModalOpen(true)} className="btn-primary mt-4 py-2 px-4 text-xs font-semibold">
              <Plus size={16} className="mr-1 inline" /> {t('newProject')}
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((proj) => {
            const status = proj.status || 'in_progress';
            return (
              <div key={proj.id} className="panel p-5 border-line flex flex-col justify-between hover:border-slate-600 transition">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-brand-blue uppercase tracking-wider">
                      {proj.client_name || proj.clientName || t('customer')}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                        status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : status === 'on_hold'
                          ? 'bg-amber-500/20 text-amber-300'
                          : status === 'cancelled'
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {t(status) || status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2">{proj.name}</h3>
                  {proj.notes ? <p className="text-xs text-slate-400 line-clamp-2 mb-3">{proj.notes}</p> : null}

                  <div className="space-y-1 text-xs text-slate-300 font-mono py-2 border-t border-line">
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t('budget')}:</span>
                      <span className="font-bold text-emerald-400">{formatMoney(proj.budget, currency)}</span>
                    </div>
                    {proj.start_date ? (
                      <div className="flex justify-between">
                        <span className="text-slate-400">{t('date')}:</span>
                        <span>{new Date(proj.start_date).toLocaleDateString(document.documentElement.lang || undefined)} {proj.end_date ? `→ ${new Date(proj.end_date).toLocaleDateString(document.documentElement.lang || undefined)}` : ''}</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="pt-3 border-t border-line mt-3 flex items-center justify-between">
                  <span className="text-xs text-slate-400">{t('status')}:</span>
                  <select
                    value={status}
                    onChange={(e) => handleStatusChange(proj.id, e.target.value)}
                    className="input-field py-1 px-2 text-xs w-auto cursor-pointer"
                  >
                    <option value="planned">{t('pending')}</option>
                    <option value="in_progress">{t('active')}</option>
                    <option value="on_hold">{t('pending')}</option>
                    <option value="completed">{t('paid')}</option>
                    <option value="cancelled">{t('cancelled')}</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Project Modal */}
      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-line bg-ink-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">{t('newProject')}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">{t('projectName')} *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('exampleProject')}
                  className="input-field py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">{t('customer')}</label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder={t('exampleClient')}
                  className="input-field py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  {t('budget')} ({currency}) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder={t('exampleProjectBudget')}
                  className="input-field py-2 text-sm font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">{t('date')}</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="input-field py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">{t('deadline')}</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="input-field py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">{t('notes')}</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={t('notesPlaceholder')}
                  className="input-field py-2 text-sm resize-none"
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
    </div>
  );
}
