import { useState, useEffect, useCallback } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Armchair,
  CheckCircle,
  Clock,
  X,
  Check,
  Pencil,
  Trash2,
} from 'lucide-react';
import { getTables, createTable, updateTable, updateTableStatus, deleteTable } from '../../api/restaurant';
import { useLanguage } from '../../context/LanguageContext.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Alert from '../../components/ui/Alert.jsx';

export default function RestaurantTablesPage() {
  const { t } = useLanguage();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [name, setName] = useState('');
  const [seats, setSeats] = useState('4');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTables();
      setTables(data);
    } catch (err) {
      setError(err.message || 'Failed to load restaurant tables');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleStatusChange(tableId, status) {
    try {
      await updateTableStatus(tableId, status);
      setTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, status } : t))
      );
    } catch (err) {
      alert(`Could not update status: ${err.message}`);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError('');

    try {
      if (editingTable) {
        await updateTable(editingTable.id, { name: name.trim(), seats: Number(seats) || 2 });
      } else {
        await createTable({ name: name.trim(), seats: Number(seats) || 2 });
      }
      setModalOpen(false);
      setEditingTable(null);
      setName('');
      setSeats('4');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to save table');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteTable(table) {
    if (!window.confirm(`Delete table "${table.name}"?`)) return;
    try {
      await deleteTable(table.id);
      loadData();
    } catch (err) {
      alert(`Could not delete table: ${err.message}`);
    }
  }

  const occupiedCount = tables.filter((t) => t.status === 'occupied').length;
  const availableCount = tables.filter((t) => t.status === 'available').length;
  const reservedCount = tables.filter((t) => t.status === 'reserved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <UtensilsCrossed className="text-brand-blue" />
            {t('tablesTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t('businessTypeRestaurantDesc')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingTable(null);
            setName('');
            setSeats('4');
            setModalOpen(true);
          }}
          className="btn-primary self-start sm:self-auto py-2.5 px-4 text-sm font-semibold flex items-center gap-2 shadow-lg shadow-brand-blue/20"
        >
          <Plus size={18} />
          {t('newTable')}
        </button>
      </div>

      {error ? <div className="panel border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div> : null}

      {/* Summary indicators */}
      <div className="grid grid-cols-3 gap-3">
        <div className="panel p-4 border-emerald-500/30 bg-emerald-500/5 text-center">
          <p className="text-xs text-slate-400 font-semibold uppercase">{t('availableTable')}</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{availableCount}</p>
        </div>
        <div className="panel p-4 border-amber-500/30 bg-amber-500/5 text-center">
          <p className="text-xs text-slate-400 font-semibold uppercase">{t('occupied')}</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{occupiedCount}</p>
        </div>
        <div className="panel p-4 border-blue-500/30 bg-blue-500/5 text-center">
          <p className="text-xs text-slate-400 font-semibold uppercase">{t('reserved')}</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{reservedCount}</p>
        </div>
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={32} /></div>
      ) : tables.length === 0 ? (
        <EmptyState
          icon={Armchair}
          title={t('noData')}
          description={t('tablesTitle')}
          action={
            <button onClick={() => setModalOpen(true)} className="btn-primary mt-4 py-2 px-4 text-xs font-semibold">
              <Plus size={16} className="mr-1 inline" /> {t('newTable')}
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {tables.map((table) => {
            const status = table.status || 'available';
            const isOcc = status === 'occupied';
            const isRes = status === 'reserved';

            return (
              <div
                key={table.id}
                className={`panel p-5 flex flex-col justify-between items-center text-center transition border relative group ${
                  isOcc
                    ? 'border-amber-500/60 bg-amber-500/10 shadow-glow'
                    : isRes
                    ? 'border-blue-500/50 bg-blue-500/5'
                    : 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60'
                }`}
              >
                {/* Edit & Delete Action Buttons */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-70 group-hover:opacity-100 transition">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTable(table);
                      setName(table.name);
                      setSeats(String(table.seats || 4));
                      setModalOpen(true);
                    }}
                    className="p-1 rounded-lg bg-white/10 hover:bg-brand-blue/20 text-slate-300 hover:text-brand-blue transition"
                    title={t('edit') || 'Edit Table'}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTable(table)}
                    className="p-1 rounded-lg bg-white/10 hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition"
                    title={t('delete') || 'Delete Table'}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <div>
                  <div
                    className={`h-14 w-14 rounded-2xl mx-auto flex items-center justify-center mb-3 ${
                      isOcc
                        ? 'bg-amber-500/20 text-amber-300'
                        : isRes
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    <Armchair size={28} />
                  </div>
                  <h3 className="font-bold text-white text-base">{table.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{table.seats} {t('capacity')}</p>
                </div>

                <div className="w-full mt-4 pt-3 border-t border-line/60">
                  <span
                    className={`inline-block w-full py-1 rounded-lg text-xs font-bold uppercase tracking-wider mb-2.5 ${
                      isOcc
                        ? 'bg-amber-500/20 text-amber-300'
                        : isRes
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {t(status) || status}
                  </span>

                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(table.id, isOcc ? 'available' : 'occupied')}
                      className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-200"
                    >
                      {isOcc ? t('availableTable') : t('occupied')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(table.id, isRes ? 'available' : 'reserved')}
                      className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-200"
                    >
                      {isRes ? t('availableTable') : t('reserved')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Table Modal */}
      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl border border-line bg-ink-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Armchair size={18} className="text-brand-blue" />
                {editingTable ? (t('edit') || 'Edit Table') : (t('newTable') || 'New Table')}
              </h3>
              <button
                onClick={() => {
                  setModalOpen(false);
                  setEditingTable(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  {t('tableName') || t('name') || 'Table Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('exampleTableName')}
                  className="input-field py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  {t('capacity')}
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={seats}
                  onChange={(e) => setSeats(e.target.value)}
                  className="input-field py-2 text-sm font-mono"
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
