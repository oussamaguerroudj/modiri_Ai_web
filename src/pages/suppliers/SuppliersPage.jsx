import { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  Plus,
  Search,
  Phone,
  Edit2,
  Trash2,
  X,
  Check,
  Package,
  Eye,
} from 'lucide-react';
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '../../api/suppliers';
import { useLanguage } from '../../context/LanguageContext.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Alert from '../../components/ui/Alert.jsx';

export default function SuppliersPage() {
  const { t } = useLanguage();

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Detailed Modal
  const [viewSupplier, setViewSupplier] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSuppliers();
      setSuppliers(data);
    } catch (err) {
      setError(err.message || 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openCreateModal() {
    setEditingSupplier(null);
    setName('');
    setPhone('');
    setError('');
    setModalOpen(true);
  }

  function openEditModal(s) {
    setEditingSupplier(s);
    setName(s.name || '');
    setPhone(s.phone || '');
    setError('');
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError('');

    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, {
          name: name.trim(),
          phone: phone.trim() || undefined,
        });
      } else {
        await createSupplier({
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

  async function handleDelete(s) {
    if (!confirm(t('confirmDelete') || `Delete supplier "${s.name}"?`)) return;
    try {
      await deleteSupplier(s.id);
      if (viewSupplier && viewSupplier.id === s.id) {
        setViewSupplier(null);
      }
      loadData();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  }

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.phone && s.phone.includes(search))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Truck className="text-brand-blue" />
            {t('moreSuppliers') || 'Suppliers & Vendors'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t('navDashboard')}: {t('supplier')}, {t('phone')}, {t('stock')}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="btn-primary self-start sm:self-auto py-2.5 px-4 text-sm font-semibold flex items-center gap-2 shadow-lg shadow-brand-blue/20"
        >
          <Plus size={18} />
          {t('addSupplier') || 'Add Supplier'}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder={t('searchPlaceholder') || 'Search suppliers by name or contact...'}
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
          icon={Truck}
          title={t('noData') || 'No suppliers registered'}
          description="Maintain your supplier network to track purchase orders, wholesale inventory, and restock costs."
          action={
            <button onClick={openCreateModal} className="btn-primary mt-4 py-2 px-4 text-xs font-semibold">
              <Plus size={16} className="mr-1 inline" /> {t('addSupplier') || 'Add First Supplier'}
            </button>
          }
        />
      ) : (
        <div className="panel overflow-hidden border-line">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-ink-950 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">{t('supplier')}</th>
                  <th className="py-3.5 px-4">{t('phone')}</th>
                  <th className="py-3.5 px-4 text-center">{t('itemCount')}</th>
                  <th className="py-3.5 px-4 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-slate-300 text-xs sm:text-sm">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-white/5 transition">
                    <td className="py-3 px-4 font-semibold text-white">
                      <span
                        onClick={() => setViewSupplier(s)}
                        className="hover:text-brand-blue cursor-pointer"
                      >
                        {s.name}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono">
                      {s.phone ? (
                        <span className="flex items-center gap-1.5">
                          <Phone size={13} className="text-slate-500" />
                          {s.phone}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/5 border border-line text-slate-300">
                        {s.products_count ?? s.productsCount ?? 0} {t('productsAndStock') || 'Products'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewSupplier(s)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                          title={t('viewDetails')}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(s)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                          title={t('edit')}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(s)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10"
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

      {/* DETAILED SUPPLIER VIEW MODAL */}
      {viewSupplier ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-line bg-ink-900 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Truck size={18} className="text-brand-blue" />
                {t('details')}
              </h3>
              <button onClick={() => setViewSupplier(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-white/5 border border-line">
                <p className="text-xs uppercase font-semibold text-slate-400">{t('supplier')}</p>
                <h2 className="text-lg font-bold text-white mt-1">{viewSupplier.name}</h2>
                {viewSupplier.phone && (
                  <p className="text-slate-300 font-mono mt-1 flex items-center gap-1.5">
                    <Phone size={13} className="text-brand-blue" />
                    {viewSupplier.phone}
                  </p>
                )}
              </div>

              <div className="p-3.5 rounded-xl border border-line bg-ink-950 flex justify-between items-center">
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-semibold">{t('productsAndStock')} {t('supplied')}</span>
                  <p className="font-mono text-base font-bold text-brand-blue mt-0.5">
                    {viewSupplier.products_count ?? viewSupplier.productsCount ?? 0}
                  </p>
                </div>
                <Package size={24} className="text-slate-500" />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => {
                    const s = viewSupplier;
                    setViewSupplier(null);
                    handleDelete(s);
                  }}
                  className="btn-ghost py-2 px-3 text-xs text-red-400 flex items-center gap-1.5"
                >
                  <Trash2 size={14} /> {t('delete')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const s = viewSupplier;
                    setViewSupplier(null);
                    openEditModal(s);
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
                <Truck size={18} className="text-brand-blue" />
                {editingSupplier ? (t('edit') + ': ' + editingSupplier.name) : (t('addSupplier') || 'Add New Supplier')}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <Alert>{error}</Alert>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">{t('supplier')} *</label>
                <input
                  type="text"
                  required
                  placeholder={t('exampleSupplierName')}
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
                  {submitting ? <Spinner size={16} /> : (t('save') || 'Save Supplier')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
