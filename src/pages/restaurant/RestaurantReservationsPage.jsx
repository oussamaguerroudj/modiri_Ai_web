import { useState, useEffect, useCallback } from 'react';
import {
  CalendarClock,
  Plus,
  Users,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  X,
  Check,
  UtensilsCrossed,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  getReservations,
  createReservation,
  updateReservation,
  deleteReservation,
  updateReservationStatus,
  getTables,
} from '../../api/restaurant';
import { useLanguage } from '../../context/LanguageContext.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Alert from '../../components/ui/Alert.jsx';

export default function RestaurantReservationsPage() {
  const { t } = useLanguage();
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    tableId: '',
    guestCount: '2',
    reservationTime: new Date().toISOString().slice(0, 16),
    notes: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [res, tbls] = await Promise.all([getReservations(), getTables()]);
      setReservations(res);
      setTables(tbls);
    } catch (err) {
      setError(err.message || 'Failed to load reservations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleOpenCreate() {
    setEditingReservation(null);
    setFormData({
      customerName: '',
      customerPhone: '',
      tableId: tables[0]?.id || '',
      guestCount: '2',
      reservationTime: new Date().toISOString().slice(0, 16),
      notes: '',
    });
    setModalOpen(true);
  }

  function handleOpenEdit(res) {
    setEditingReservation(res);
    const resTime = res.reservation_time || res.reservationTime || res.reserved_at;
    let formattedTime = new Date().toISOString().slice(0, 16);
    if (resTime) {
      try {
        formattedTime = new Date(resTime).toISOString().slice(0, 16);
      } catch (e) {
        // fallback
      }
    }
    setFormData({
      customerName: res.customer_name || res.customerName || '',
      customerPhone: res.phone || res.customer_phone || res.customerPhone || '',
      tableId: res.table_id || res.tableId || '',
      guestCount: String(res.party_size || res.guest_count || res.guestCount || 2),
      reservationTime: formattedTime,
      notes: res.notes || '',
    });
    setModalOpen(true);
  }

  async function handleDelete(id) {
    if (!window.confirm(t('confirmDelete') || 'Are you sure you want to delete this reservation?')) return;
    try {
      await deleteReservation(id);
      loadData();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await updateReservationStatus(id, status);
      loadData();
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.customerName.trim()) return;
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim() || undefined,
        tableId: formData.tableId || undefined,
        guestCount: Number(formData.guestCount) || 2,
        reservationTime: formData.reservationTime,
        notes: formData.notes.trim() || undefined,
      };

      if (editingReservation) {
        await updateReservation(editingReservation.id, payload);
      } else {
        await createReservation(payload);
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to save reservation');
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
            <CalendarClock className="text-brand-blue" />
            {t('reservations')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t('businessTypeRestaurantDesc')}
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="btn-primary self-start sm:self-auto py-2.5 px-4 text-sm font-semibold flex items-center gap-2 shadow-lg shadow-brand-blue/20"
        >
          <Plus size={18} /> {t('newReservation')}
        </button>
      </div>

      {error ? <div className="panel border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div> : null}

      {/* Reservations Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={32} /></div>
      ) : reservations.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title={t('noData')}
          description={t('reservations')}
          action={
            <button onClick={handleOpenCreate} className="btn-primary mt-4 py-2 px-4 text-xs font-semibold">
              <Plus size={16} className="mr-1 inline" /> {t('newReservation')}
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
                  <th className="py-3.5 px-4">{t('capacity')}</th>
                  <th className="py-3.5 px-4">{t('table')}</th>
                  <th className="py-3.5 px-4">{t('date')}</th>
                  <th className="py-3.5 px-4">{t('status')}</th>
                  <th className="py-3.5 px-4 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-slate-300">
                {reservations.map((res) => {
                  const status = res.status || 'confirmed';
                  return (
                    <tr key={res.id} className="hover:bg-white/5 transition">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {res.customer_name || res.customerName}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400 font-mono">
                        {res.customer_phone || res.customerPhone || res.phone || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <span className="flex items-center gap-1">
                          <Users size={13} className="text-slate-400" />
                          {res.guest_count || res.guestCount || res.party_size}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-brand-blue">
                        {res.table_name || (res.table_id ? `${t('table')} #${res.table_id}` : '—')}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-300 font-mono">
                        {res.reservation_time || res.reserved_at ? new Date(res.reservation_time || res.reserved_at).toLocaleString(document.documentElement.lang || undefined) : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                            status === 'completed' || status === 'seated'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : status === 'cancelled' || status === 'no_show'
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}
                        >
                          {t(status) || status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {status === 'confirmed' || status === 'pending' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(res.id, 'seated')}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                                title={t('seated') || 'Seat'}
                              >
                                <CheckCircle size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(res.id, 'cancelled')}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                                title={t('cancelled') || 'Cancel'}
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(res)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10 transition"
                            title={t('edit')}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(res.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
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

      {/* Book / Edit Reservation Modal */}
      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-line bg-ink-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">
              {editingReservation ? (t('editReservation') || 'Edit Reservation') : t('newReservation')}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">{t('fullName')} *</label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder={t('exampleGuestName')}
                  className="input-field py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">{t('phone')}</label>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  placeholder="+213 555 11 22 33"
                  className="input-field py-2 text-sm font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">{t('capacity')}</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.guestCount}
                    onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
                    className="input-field py-2 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">{t('table')}</label>
                  <select
                    value={formData.tableId}
                    onChange={(e) => setFormData({ ...formData, tableId: e.target.value })}
                    className="input-field py-2 text-sm"
                  >
                    <option value="">{t('all')}</option>
                    {tables.map((tItem) => (
                      <option key={tItem.id} value={tItem.id} className="bg-ink-900 text-white">
                        {tItem.name} ({tItem.seats} {t('capacity')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">{t('date')} *</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.reservationTime}
                  onChange={(e) => setFormData({ ...formData, reservationTime: e.target.value })}
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
    </div>
  );
}
