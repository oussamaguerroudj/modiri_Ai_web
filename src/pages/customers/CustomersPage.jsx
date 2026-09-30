import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  Edit2,
  Trash2,
  X,
  Check,
  UserCheck,
  Eye,
  DollarSign,
} from 'lucide-react';
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../../api/customers';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { formatMoney } from '../../utils/currency.js';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Alert from '../../components/ui/Alert.jsx';

export default function CustomersPage() {
  const { company } = useAuth();
  const { t } = useLanguage();
  const currency = company?.currency || 'DZD';

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Detailed Modal
  const [viewCustomer, setViewCustomer] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (err) {
      setError(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openCreateModal() {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setError('');
    setModalOpen(true);
  }

  function openEditModal(c) {
    setEditingCustomer(c);
    setName(c.name || '');
    setPhone(c.phone || '');
    setError('');
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError('');

    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, {
          name: name.trim(),
          phone: phone.trim() || undefined,
        });
      } else {
        await createCustomer({
          name: name.trim(),
          phone: phone.trim() || undefined,
        });
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(c) {
    if (!confirm(t('confirmDelete') || `Delete customer "${c.name}"?`)) return;
    try {
      await deleteCustomer(c.id);
      if (viewCustomer && viewCustomer.id === c.id) {
        setViewCustomer(null);
      }
      loadData();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  }

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Users className="text-brand-blue" />
            {t('moreCustomers') || 'Customers Directory'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t('navDashboard')}: {t('customer')}, {t('phone')}, {t('credit')}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="btn-primary self-start sm:self-auto py-2.5 px-4 text-sm font-semibold flex items-center gap-2 shadow-lg shadow-brand-blue/20"
        >
          <Plus size={18} />
          {t('addCustomer') || 'Add Customer'}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder={t('searchPlaceholder') || 'Search customers by name or phone...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10 py-2.5 text-xs sm:text-sm"
        />
      </div>

      {error ? <div className="panel border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div> : null}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={32} /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t('noCustomersYet') || 'No customers registered'}
          description="Build your client book to track purchases, store credit, and loyalty."
          action={
            <button onClick={openCreateModal} className="btn-primary mt-4 py-2 px-4 text-xs font-semibold">
              <Plus size={16} className="mr-1 inline" /> {t('addCustomer') || 'Add First Customer'}
            </button>
          }
        />
      ) : (
        <div className="panel overflow-hidden border-line">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-ink-950 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">{t('customer')}</th>
                  <th className="py-3.5 px-4">{t('phone')}</th>
                  <th className="py-3.5 px-4 font-mono">{t('credit') || 'Credit Balance Due'}</th>
                  <th className="py-3.5 px-4 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-slate-300 text-xs sm:text-sm">
                {filtered.map((c) => {
                  const balance = Number(c.credit_balance || c.balance_due || 0);
                  return (
                    <tr key={c.id} className="hover:bg-white/5 transition">
                      <td className="py-3 px-4 font-semibold text-white">
                        <span
                          onClick={() => setViewCustomer(c)}
                          className="hover:text-brand-blue cursor-pointer"
                        >
                          {c.name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono">
                        {c.phone ? (
                          <span className="flex items-center gap-1.5">
                            <Phone size={13} className="text-slate-500" />
                            {c.phone}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold">
                        {balance > 0 ? (
                          <span className="text-amber-400">
                            {formatMoney(balance, currency)}
                          </span>
                        ) : (
                          <span className="text-emerald-400">0.00 {currency}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewCustomer(c)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                            title={t('viewDetails')}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(c)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                            title={t('edit')}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(c)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                            title={t('delete')}
                          >
                            <Trash2 size={15} />
                          </button>
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

      {/* DETAILED CUSTOMER VIEW MODAL */}
      {viewCustomer ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-line bg-ink-900 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users size={18} className="text-brand-blue" />
                {t('customerDetails') || 'Customer File'}
              </h3>
              <button onClick={() => setViewCustomer(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-white/5 border border-line">
                <p className="text-xs uppercase font-semibold text-slate-400">{t('customer')}</p>
                <h2 className="text-lg font-bold text-white mt-1">{viewCustomer.name}</h2>
                {viewCustomer.phone && (
                  <p className="text-slate-300 font-mono mt-1 flex items-center gap-1.5">
                    <Phone size={13} className="text-brand-blue" />
                    {viewCustomer.phone}
                  </p>
                )}
              </div>

              <div className="p-3.5 rounded-xl border border-line bg-ink-950 flex justify-between items-center">
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-semibold">{t('credit') || 'Debt Balance'}</span>
                  <p className={`font-mono text-base font-bold mt-0.5 ${Number(viewCustomer.credit_balance || 0) > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {formatMoney(viewCustomer.credit_balance || 0, currency)}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${Number(viewCustomer.credit_balance || 0) > 0 ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                  {Number(viewCustomer.credit_balance || 0) > 0 ? t('unpaid') : t('paid')}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => {
                    const c = viewCustomer;
                    setViewCustomer(null);
                    handleDelete(c);
                  }}
                  className="btn-ghost py-2 px-3 text-xs text-red-400 flex items-center gap-1.5"
                >
                  <Trash2 size={14} /> {t('delete')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const c = viewCustomer;
                    setViewCustomer(null);
                    openEditModal(c);
                  }}
                  className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Edit2 size={14} /> {t('edit')}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* CREATE / EDIT MODAL */}
      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-line bg-ink-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users size={18} className="text-brand-blue" />
                {editingCustomer ? (t('edit') + ': ' + editingCustomer.name) : (t('addCustomer') || 'Add New Customer')}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <Alert>{error}</Alert>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">{t('customer')} *</label>
                <input
                  type="text"
                  required
                  placeholder={t('exampleCustomerName')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">{t('phone')}</label>
                <input
                  type="tel"
                  placeholder="+213 555 00 00 00"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-field py-2 text-sm font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-line">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost py-2 px-4 text-xs font-semibold">
                  {t('cancel')}
                </button>
                <button type="submit" disabled={submitting} className="btn-primary py-2 px-5 text-xs font-semibold">
                  {submitting ? <Spinner size={16} /> : (t('save') || 'Save Customer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
