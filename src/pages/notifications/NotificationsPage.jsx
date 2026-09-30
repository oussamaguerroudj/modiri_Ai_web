import { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  AlertTriangle,
  Receipt,
  Calendar,
  DollarSign,
  Package,
  Check,
  Clock,
} from 'lucide-react';
import { getNotifications, markNotificationRead } from '../../api/notifications';
import { useLanguage } from '../../context/LanguageContext.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';

export default function NotificationsPage() {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleMarkRead(id) {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  }

  function iconFor(type) {
    switch (type) {
      case 'low_stock':
        return <Package className="text-amber-400" size={20} />;
      case 'unpaid_invoice':
        return <Receipt className="text-red-400" size={20} />;
      case 'appointment_reminder':
        return <Calendar className="text-blue-400" size={20} />;
      case 'salary_reminder':
        return <DollarSign className="text-emerald-400" size={20} />;
      default:
        return <AlertTriangle className="text-amber-400" size={20} />;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Bell className="text-brand-blue" />
          {t('notificationsAlertsTitle') || 'Business Alerts & Notifications'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          {t('notificationsAlertsSubtitle') || 'Real-time warnings derived from live inventory thresholds, upcoming appointments, and invoice payments.'}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={32} /></div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={t('allCaughtUp') || 'All caught up!'}
          description={t('noAlertsDesc') || 'You have no unread business alerts right now.'}
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const isRead = n.is_read || n.isRead;
            return (
              <div
                key={n.id}
                className={`panel p-4 flex items-start justify-between gap-4 transition ${
                  isRead ? 'opacity-60 bg-ink-900/40' : 'border-brand-blue/30 bg-white/5'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-ink-900 border border-line shrink-0">
                    {iconFor(n.type)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      {n.title}
                      {!isRead ? (
                        <span className="h-2 w-2 rounded-full bg-brand-blue animate-pulse" />
                      ) : null}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{n.body || n.message}</p>
                    <p className="text-[11px] text-slate-500 mt-2 font-mono flex items-center gap-1">
                      <Clock size={12} />
                      {n.created_at ? new Date(n.created_at).toLocaleString(document.documentElement.lang || undefined) : 'Recent'}
                    </p>
                  </div>
                </div>

                {!isRead ? (
                  <button
                    type="button"
                    onClick={() => handleMarkRead(n.id)}
                    className="btn-ghost py-1.5 px-3 text-xs font-semibold shrink-0 flex items-center gap-1"
                  >
                    <Check size={14} /> {t('markAsRead') || 'Mark as read'}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
