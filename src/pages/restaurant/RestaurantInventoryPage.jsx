import { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Plus,
  AlertTriangle,
  Edit2,
  Trash2,
  SlidersHorizontal,
  X,
  Check,
} from 'lucide-react';
import {
  getRestaurantInventory,
  createRestaurantInventoryItem,
  adjustInventoryQuantity,
  archiveInventoryItem,
} from '../../api/restaurant';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { formatMoney } from '../../utils/currency.js';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Alert from '../../components/ui/Alert.jsx';

export default function RestaurantInventoryPage() {
  const { company } = useAuth();
  const { t } = useLanguage();
  const currency = company?.currency || 'DZD';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add Item Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    unit: 'kg',
    currentStock: '0',
    minimumStock: '5',
    costPerUnit: '0',
  });
  const [submitting, setSubmitting] = useState(false);

  // Adjustment Modal
  const [adjustItem, setAdjustItem] = useState(null);
  const [adjustDelta, setAdjustDelta] = useState('');
  const [adjustReason, setAdjustReason] = useState('replenishment'); // 'replenishment' | 'waste' | 'correction'
  const [adjustNotes, setAdjustNotes] = useState('');
  const [submittingAdjust, setSubmittingAdjust] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRestaurantInventory();
      setItems(data);
    } catch (err) {
      setError(err.message || 'Failed to load restaurant inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreateItem(e) {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSubmitting(true);
    try {
      await createRestaurantInventoryItem({
        name: formData.name.trim(),
        unit: formData.unit.trim(),
        currentStock: Number(formData.currentStock) || 0,
        minimumStock: Number(formData.minimumStock) || 0,
        costPerUnit: Number(formData.costPerUnit) || 0,
      });
      setModalOpen(false);
      loadData();
    } catch (err) {
      alert(`Failed to add inventory item: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAdjustQuantity(e) {
    e.preventDefault();
    if (!adjustItem || !adjustDelta) return;
    setSubmittingAdjust(true);
    try {
      await adjustInventoryQuantity(adjustItem.id, {
        delta: Number(adjustDelta),
        reason: adjustReason,
        notes: adjustNotes.trim() || undefined,
      });
      setAdjustItem(null);
      loadData();
    } catch (err) {
      alert(`Adjustment failed: ${err.message}`);
    } finally {
      setSubmittingAdjust(false);
    }
  }

  async function handleDelete(item) {
    if (!confirm(`Archive inventory item "${item.name}"?`)) return;
    try {
      await archiveInventoryItem(item.id);
      loadData();
    } catch (err) {
      alert(`Failed: ${err.message}`);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Package className="text-brand-blue" />
            {t('kitchenInventory')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t('recipeIngredients')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setFormData({
              name: '',
              unit: 'kg',
              currentStock: '0',
              minimumStock: '5',
              costPerUnit: '0',
            });
            setModalOpen(true);
          }}
          className="btn-primary self-start sm:self-auto py-2.5 px-4 text-sm font-semibold flex items-center gap-2 shadow-lg shadow-brand-blue/20"
        >
          <Plus size={18} /> {t('save')}
        </button>
      </div>

      {error ? <div className="panel border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div> : null}

      {/* Inventory Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={32} /></div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Package}
          title={t('noData')}
          description={t('kitchenInventory')}
        />
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-ink-900/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">{t('recipeIngredients')}</th>
                  <th className="py-3.5 px-4">{t('unitPrice')}</th>
                  <th className="py-3.5 px-4">{t('stock')}</th>
                  <th className="py-3.5 px-4">{t('purchasePrice')}</th>
                  <th className="py-3.5 px-4">{t('minStock')}</th>
                  <th className="py-3.5 px-4 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-slate-300">
                {items.map((item) => {
                  const stock = Number(item.current_stock ?? item.currentStock) || 0;
                  const min = Number(item.minimum_stock ?? item.minimumStock) || 0;
                  const isLow = stock <= min;

                  return (
                    <tr key={item.id} className="hover:bg-white/5 transition">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {item.name}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-400 uppercase">
                        {item.unit || 'unit'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            stock === 0
                              ? 'bg-red-500/20 text-red-300'
                              : isLow
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {isLow ? <AlertTriangle size={12} /> : null}
                          {stock} {item.unit}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                        {formatMoney(item.cost_per_unit ?? item.costPerUnit, currency)}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-400">
                        {min} {item.unit}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustItem(item);
                              setAdjustDelta('');
                              setAdjustNotes('');
                            }}
                            className="btn-ghost py-1 px-2.5 text-xs font-semibold flex items-center gap-1"
                            title={t('edit')}
                          >
                            <SlidersHorizontal size={14} /> {t('edit')}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                            title={t('confirmDelete')}
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

      {/* Add Item Modal */}
      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-line bg-ink-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">{t('recipeIngredients')}</h3>
            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">{t('dishName')} *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('exampleIngredientName')}
                  className="input-field py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">{t('unitPrice')}</label>
                  <input
                    type="text"
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder={t('measurementUnits')}
                    className="input-field py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">{t('stock')}</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                    className="input-field py-2 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">{t('purchasePrice')}</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.costPerUnit}
                    onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })}
                    className="input-field py-2 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">{t('minStock')}</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.minimumStock}
                    onChange={(e) => setFormData({ ...formData, minimumStock: e.target.value })}
                    className="input-field py-2 text-sm font-mono"
                  />
                </div>
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

      {/* Adjust Stock Modal */}
      {adjustItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl border border-line bg-ink-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">{t('edit')}: {adjustItem.name}</h3>
            <p className="text-xs text-slate-400 mb-4">
              {t('stock')}: {adjustItem.current_stock ?? adjustItem.currentStock} {adjustItem.unit}
            </p>

            <form onSubmit={handleAdjustQuantity} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  {t('quantity')} *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(e.target.value)}
                  placeholder={t('exampleStockAdjustment')}
                  className="input-field py-2 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">{t('category')}</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="input-field py-2 text-sm cursor-pointer"
                >
                  <option value="replenishment">{t('stock')} (+)</option>
                  <option value="waste">{t('moreExpenses')} (-)</option>
                  <option value="correction">{t('edit')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">{t('notes')}</label>
                <input
                  type="text"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder={t('notesPlaceholder')}
                  className="input-field py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-line">
                <button type="button" onClick={() => setAdjustItem(null)} className="btn-ghost py-2 px-4 text-xs font-semibold">
                  {t('close')}
                </button>
                <button type="submit" disabled={submittingAdjust} className="btn-primary py-2 px-5 text-xs font-semibold">
                  {submittingAdjust ? <Spinner size={16} /> : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
