import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Activity,
  Wallet,
  Armchair,
  Star,
  ChefHat,
  ShoppingCart,
  UtensilsCrossed,
  ClipboardList,
  CalendarClock,
  ArrowRight,
  Stethoscope,
  Users,
  UserCheck,
  Calendar,
  AlertTriangle,
  Pill,
  Package,
  TrendingUp,
  FolderKanban,
  Building2,
  ScanLine,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getRestaurantDashboard, getActiveOrders } from '../api/restaurant';
import { getClinicDashboard, getQueue, callNextPatient } from '../api/clinic';
import { getPharmacyDashboard, getExpiringProducts } from '../api/pharmacy';
import { getSuperetteDashboard } from '../api/superette';
import { getClothingDashboard } from '../api/clothing';
import { getEnterpriseDashboard } from '../api/enterprise';
import { getDashboardSummary } from '../api/dashboard';
import StatCard from '../components/ui/StatCard.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { formatMoney } from '../utils/currency.js';

function HeroBanner({ title, subtitle, icon: Icon, badge, bgImage, statusChips = [], actionButton = null }) {
  const { t, language } = useLanguage();
  const hour = new Date().getHours();
  const greetingText = hour < 12 ? (t('goodMorning') || 'Good morning') : (t('goodMorning') || 'Hello');
  const localeStr = language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US';
  const today = new Date().toLocaleDateString(localeStr, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-line shadow-panel transition-all duration-300 hero-banner group"
      data-theme-contrast="dark"
    >
      {/* Background Photography with Zoom Hover Effect */}
      {bgImage && (
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      )}

      {/* Atmospheric High-Clarity Scrim Gradient:
          Rich dark glass scrim that keeps the photography 100% visible, vibrant, and stunning while ensuring pure white text has superb contrast in BOTH light and dark modes */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/75 to-slate-900/40 dark:from-ink-950/95 dark:via-ink-950/85 dark:to-ink-950/60" />

      {/* Atmospheric Content */}
      <div className="relative z-10 flex flex-col justify-between gap-6 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-brand-blue/30 text-white border border-brand-blue/40 backdrop-blur-md flex items-center gap-1.5 shadow-sm">
                {Icon ? <Icon size={14} className="text-brand-blue" /> : null}
                {badge}
              </span>
              <span className="text-xs font-medium text-slate-200">
                {greetingText} ☀️
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
              {title}
            </h1>
            <p className="mt-1.5 max-w-xl text-xs sm:text-sm text-slate-200 leading-relaxed font-normal drop-shadow-sm">
              {subtitle}
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2.5 shrink-0">
            <div className="flex items-center gap-2 self-start sm:self-auto rounded-xl border border-white/20 bg-slate-950/75 px-3.5 py-2 text-xs font-medium text-slate-200 backdrop-blur-md shadow-sm">
              <CalendarDays size={15} className="text-brand-blue" />
              <span>{today}</span>
            </div>
            {actionButton}
          </div>
        </div>

        {/* Themed Live Status Badges & Quick Indicators */}
        {statusChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/15">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              {t('liveOperations') || 'Live Operations:'}
            </span>
            {statusChips.map((chip, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-slate-950/75 px-3 py-1 text-xs font-medium text-white backdrop-blur-md shadow-sm"
              >
                {chip}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 1. Restaurant & Café Dashboard
function RestaurantDashboard() {
  const { company } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const currency = company?.currency || 'DZD';

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [dash, orders] = await Promise.all([getRestaurantDashboard(), getActiveOrders()]);
        if (!cancelled) {
          setStats(dash);
          setActiveOrders(orders || []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load restaurant dashboard.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <HeroBanner
        title={company?.name || t('restaurant') || 'Restaurant & Café'}
        subtitle={t('restaurantHeroSubtitle') || 'Manage live orders, table reservations, and kitchen ingredients in real time.'}
        icon={UtensilsCrossed}
        badge={t('restaurant') || 'Restaurant & Café'}
        bgImage="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80"
        statusChips={[
          "🔥 " + (t('activeKitchen') || 'Kitchen Orders Active'),
          "🍽️ " + (t('tablesTitle') || 'Dining Floor Service'),
          "🍷 " + (t('barService') || 'Bar & Takeaway Ready'),
        ]}
      />

      {error ? <div className="panel border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div> : null}

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={32} /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard icon={ClipboardList} tone="blue" label={t('today') + ' ' + (t('ordersTitle') || 'Orders')} value={stats?.ordersToday ?? 0} sublabel={t('today')} onClick={() => navigate('/restaurant/orders')} />
            <StatCard icon={Activity} tone="violet" label={t('active') + ' ' + (t('ordersTitle') || 'Orders')} value={stats?.activeOrders ?? 0} sublabel={t('activeKitchen')} onClick={() => navigate('/restaurant/orders')} />
            <StatCard icon={Wallet} tone="teal" label={t('today') + ' ' + (t('revenue') || 'Revenue')} value={formatMoney(stats?.todayRevenue, currency)} sublabel={t('revenue')} onClick={() => navigate('/reports')} />
            <StatCard icon={Armchair} tone="amber" highlight label={t('tablesTitle') || 'Tables'} value={`${stats?.tablesOccupied ?? 0}/${stats?.tablesTotal ?? 0}`} sublabel={t('status')} onClick={() => navigate('/restaurant/tables')} />
            <StatCard icon={CalendarClock} tone="blue" label={t('reservations') || 'Reservations'} value={stats?.reservationsToday ?? 0} onClick={() => navigate('/restaurant/reservations')} />
            <StatCard icon={Star} tone="violet" label={t('unpaid') || 'Outstanding Unpaid'} value={formatMoney(stats?.outstandingPayments, currency)} onClick={() => navigate('/restaurant/orders')} />
          </div>

          {/* Restaurant Ambiance & Service Floor Card */}
          <div className="rounded-2xl border border-line bg-ink-900/70 p-5 shadow-panel overflow-hidden relative">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              {/* Left: Warm Dining Ambiance Visual */}
              <div className="relative rounded-2xl overflow-hidden h-48 border border-line group shadow-md image-overlay" data-theme-contrast="dark">
                <img
                  src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"
                  alt={t('restaurantAtmosphere')}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex flex-col justify-end p-4">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 drop-shadow">
                    <UtensilsCrossed size={14} className="text-brand-amber" />
                    {company?.name || t('diningRoom') || 'Restaurant Dining Room'}
                  </span>
                  <p className="text-[11px] text-slate-200 mt-0.5 drop-shadow-sm">
                    {stats?.tablesOccupied ?? 0} {t('occupied')} · {stats?.tablesTotal ?? 0} {t('tablesTitle')} {t('total')}
                  </p>
                </div>
              </div>

              {/* Center & Right: Live Service Insights & Fast Navigation */}
              <div className="lg:col-span-2 flex flex-col justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{t('diningFloorAndKitchen') || 'Dining Floor & Kitchen Service'}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {t('activeService') || 'Active Service'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {t('diningFloorDesc') || 'Monitor dining room occupancy in real time, assign orders to tables, manage chef recipes, and keep kitchen stock updated before peak hours.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <button
                    onClick={() => navigate('/restaurant/orders')}
                    className="flex flex-col items-center p-3 rounded-xl border border-line bg-white/5 hover:bg-brand-blue/10 hover:border-brand-blue/40 transition group"
                  >
                    <ShoppingCart size={18} className="text-brand-blue group-hover:scale-110 transition" />
                    <span className="text-xs font-semibold text-white mt-1.5">{t('ordersTitle') || 'Orders'}</span>
                    <span className="text-[10px] text-slate-400">{stats?.activeOrders ?? 0} {t('active')}</span>
                  </button>

                  <button
                    onClick={() => navigate('/restaurant/tables')}
                    className="flex flex-col items-center p-3 rounded-xl border border-line bg-white/5 hover:bg-brand-amber/10 hover:border-brand-amber/40 transition group"
                  >
                    <UtensilsCrossed size={18} className="text-brand-amber group-hover:scale-110 transition" />
                    <span className="text-xs font-semibold text-white mt-1.5">{t('tablesTitle') || 'Tables'}</span>
                    <span className="text-[10px] text-slate-400">{stats?.tablesOccupied ?? 0} {t('occupied')}</span>
                  </button>

                  <button
                    onClick={() => navigate('/restaurant/menu')}
                    className="flex flex-col items-center p-3 rounded-xl border border-line bg-white/5 hover:bg-brand-violet/10 hover:border-brand-violet/40 transition group"
                  >
                    <ClipboardList size={18} className="text-brand-violet group-hover:scale-110 transition" />
                    <span className="text-xs font-semibold text-white mt-1.5">{t('menuAndRecipes') || 'Menu'}</span>
                    <span className="text-[10px] text-slate-400">{t('dishes') || 'Dishes'}</span>
                  </button>

                  <button
                    onClick={() => navigate('/restaurant/reservations')}
                    className="flex flex-col items-center p-3 rounded-xl border border-line bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition group"
                  >
                    <CalendarClock size={18} className="text-emerald-400 group-hover:scale-110 transition" />
                    <span className="text-xs font-semibold text-white mt-1.5">{t('reservations') || 'Bookings'}</span>
                    <span className="text-[10px] text-slate-400">{stats?.reservationsToday ?? 0} {t('today')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="panel p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-blue/20 text-blue-300">
                  <ChefHat size={18} />
                </span>
                <h2 className="text-lg font-bold text-white">{t('activeKitchen') || 'Active Kitchen Orders'}</h2>
              </div>
              <button type="button" onClick={() => navigate('/restaurant/orders')} className="text-xs font-semibold text-brand-blue hover:underline flex items-center gap-1">
                {t('all')} <ArrowRight size={14} />
              </button>
            </div>

            {activeOrders.length === 0 ? (
              <EmptyState icon={ChefHat} title={t('noActiveOrdersMessage') || 'No active kitchen orders'} description="New orders will appear here automatically." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-line text-xs font-semibold text-slate-400 uppercase">
                    <tr>
                      <th className="pb-3">{t('table')}</th>
                      <th className="pb-3">{t('status')}</th>
                      <th className="pb-3">{t('total')}</th>
                      <th className="pb-3 text-right">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-slate-300">
                    {activeOrders.slice(0, 6).map((order) => {
                      const displayTable = order.table_label || order.tableLabel || (order.table_id ? `${t('table')} #${String(order.table_id).slice(0, 4)}` : t('takeaway'));
                      return (
                        <tr key={order.id} className="hover:bg-white/5 transition">
                          <td className="py-3 font-semibold text-white">{displayTable}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 uppercase">
                              {t(order.status) || order.status}
                            </span>
                          </td>
                          <td className="py-3 font-medium text-slate-100">{formatMoney(order.total, currency)}</td>
                          <td className="py-3 text-right">
                            <button onClick={() => navigate('/restaurant/orders')} className="text-xs text-brand-blue hover:underline font-semibold">
                              {t('details')}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button onClick={() => navigate('/restaurant/orders')} className="btn-primary justify-between p-4 text-sm font-semibold">
              <span className="flex items-center gap-2"><ShoppingCart size={18} /> {t('newOrder')}</span>
              <ArrowRight size={14} />
            </button>
            <button onClick={() => navigate('/restaurant/tables')} className="btn-ghost justify-between p-4 text-sm font-semibold">
              <span className="flex items-center gap-2"><UtensilsCrossed size={18} /> {t('tablesTitle')}</span>
              <ArrowRight size={14} />
            </button>
            <button onClick={() => navigate('/restaurant/menu')} className="btn-ghost justify-between p-4 text-sm font-semibold">
              <span className="flex items-center gap-2"><ClipboardList size={18} /> {t('menuAndRecipes')}</span>
              <ArrowRight size={14} />
            </button>
            <button onClick={() => navigate('/restaurant/inventory')} className="btn-ghost justify-between p-4 text-sm font-semibold">
              <span className="flex items-center gap-2"><Package size={18} /> {t('kitchenInventory')}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// 2. Clinic & Medical Dashboard
function ClinicDashboard() {
  const { company } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [queueData, setQueueData] = useState({ queue: [], nextPatient: null });
  const [loading, setLoading] = useState(true);
  const [callingNext, setCallingNext] = useState(false);
  const [error, setError] = useState('');
  const currency = company?.currency || 'DZD';

  async function loadData() {
    try {
      const [dash, q] = await Promise.all([getClinicDashboard(), getQueue()]);
      setStats(dash);
      setQueueData(q || { queue: [], nextPatient: null });
    } catch (err) {
      setError(err.message || 'Could not load clinic dashboard.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCallNext() {
    setCallingNext(true);
    try {
      await callNextPatient();
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to call next patient');
    } finally {
      setCallingNext(false);
    }
  }

  return (
    <div className="space-y-6">
      <HeroBanner
        title={company?.name || t('businessTypeClinic')}
        subtitle={t('businessTypeClinicDesc')}
        icon={Stethoscope}
        badge={t('businessTypeClinic')}
        bgImage="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1600&q=80"
        statusChips={[
          "🩺 " + (t('consultationSuite') || 'Consultation Suite Active'),
          "📋 " + (t('liveTriage') || 'Live Triage Desk'),
          "🕒 " + (t('queueActive') || 'Patient Queue Online'),
        ]}
      />

      {error ? <div className="panel border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div> : null}

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={32} /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Calendar} tone="blue" label={t('appointmentsToday')} value={stats?.appointmentsToday ?? 0} sublabel={t('today')} onClick={() => navigate('/appointments')} />
            <StatCard icon={UserCheck} tone="amber" highlight label={t('waitingRoomQueue')} value={stats?.queueCount ?? queueData.queue.length} sublabel={t('waitingRoom')} onClick={() => navigate('/clinic/queue')} />
            <StatCard icon={CheckCircle2} tone="teal" label={t('visitsCompleted')} value={stats?.completedVisitsToday ?? 0} sublabel={t('today')} onClick={() => navigate('/clinic/patients')} />
            <StatCard icon={Wallet} tone="violet" label={t('todayRevenue')} value={formatMoney(stats?.todayRevenue, currency)} sublabel={t('revenue')} onClick={() => navigate('/reports')} />
          </div>

          {/* Next Patient in Queue Card */}
          <div className="panel p-6 border-brand-blue/30 bg-gradient-to-r from-brand-blue/10 via-ink-800 to-ink-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/20 text-brand-blue">
                  <UserCheck size={24} />
                </span>
                <div>
                  <p className="text-xs font-semibold text-brand-blue uppercase tracking-wider">{t('nextInLine')}</p>
                  <h3 className="text-lg font-bold text-white">
                    {queueData.nextPatient?.patient_name || queueData.nextPatient?.name || t('noPatientWaiting')}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {queueData.queue.length} {t('totalInQueue')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={callingNext || queueData.queue.length === 0}
                  onClick={handleCallNext}
                  className="btn-primary py-2.5 px-5 text-sm font-semibold flex items-center gap-2"
                >
                  {callingNext ? <Spinner size={16} /> : <UserCheck size={16} />}
                  {t('callNextPatient')}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/clinic/queue')}
                  className="btn-ghost py-2.5 px-4 text-sm font-semibold"
                >
                  {t('manageQueue')}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button onClick={() => navigate('/clinic/patients')} className="btn-primary justify-between p-4 text-sm font-semibold">
              <span className="flex items-center gap-2"><Users size={18} /> {t('patientDirectory')}</span>
              <ArrowRight size={14} />
            </button>
            <button onClick={() => navigate('/clinic/queue')} className="btn-ghost justify-between p-4 text-sm font-semibold">
              <span className="flex items-center gap-2"><UserCheck size={18} /> {t('waitingRoomQueue')}</span>
              <ArrowRight size={14} />
            </button>
            <button onClick={() => navigate('/appointments')} className="btn-ghost justify-between p-4 text-sm font-semibold">
              <span className="flex items-center gap-2"><Calendar size={18} /> {t('moreAppointments')}</span>
              <ArrowRight size={14} />
            </button>
            <button onClick={() => navigate('/ai/assistant')} className="btn-ghost justify-between p-4 text-sm font-semibold">
              <span className="flex items-center gap-2"><Activity size={18} /> {t('moreAiAssistant')}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// 3. Pharmacy Dashboard
function PharmacyDashboard() {
  const { company } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [expiring, setExpiring] = useState([]);
  const [loading, setLoading] = useState(true);
  const currency = company?.currency || 'DZD';

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [dash, exp] = await Promise.all([getPharmacyDashboard(), getExpiringProducts(30)]);
        if (!cancelled) {
          setStats(dash);
          setExpiring(exp || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <HeroBanner
        title={company?.name || t('businessTypePharmacy')}
        subtitle={t('businessTypePharmacyDesc')}
        icon={Pill}
        badge={t('businessTypePharmacy')}
        bgImage="https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=1600&q=80"
        statusChips={[
          "💊 " + (t('dispensary') || 'Dispensary Counter Active'),
          "❄️ " + (t('coldChain') || 'Cold-Chain Monitored'),
          "📦 " + (t('rxInventory') || 'Formulary In Stock'),
        ]}
      />

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={32} /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={AlertTriangle} tone="amber" highlight label={t('expiringIn30Days')} value={stats?.expiringSoonCount ?? expiring.length} sublabel={t('lowStock')} onClick={() => navigate('/products')} />
            <StatCard icon={Package} tone="blue" label={t('lowStockMedications')} value={stats?.lowStockCount ?? 0} sublabel={t('minStock')} onClick={() => navigate('/products')} />
            <StatCard icon={Wallet} tone="teal" label={t('todaySales')} value={formatMoney(stats?.todayRevenue, currency)} sublabel={t('revenue')} onClick={() => navigate('/sales')} />
            <StatCard icon={TrendingUp} tone="violet" label={t('totalActiveItems')} value={stats?.totalProducts ?? 0} sublabel={t('productsAndStock')} onClick={() => navigate('/products')} />
          </div>

          {expiring.length > 0 ? (
            <div className="panel p-6 border-amber-500/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle size={20} />
                  <h3 className="font-bold text-white">{t('expiringMedications')}</h3>
                </div>
                <button onClick={() => navigate('/products')} className="text-xs font-semibold text-amber-400 hover:underline">
                  {t('productsAndStock')} →
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-line text-xs font-semibold text-slate-400 uppercase">
                    <tr>
                      <th className="pb-3">{t('productsAndStock')}</th>
                      <th className="pb-3">{t('category')}</th>
                      <th className="pb-3">{t('stock')}</th>
                      <th className="pb-3">{t('expirationDate')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-slate-300">
                    {expiring.slice(0, 5).map((item) => (
                      <tr key={item.id} className="hover:bg-white/5">
                        <td className="py-3 font-semibold text-white">{item.name}</td>
                        <td className="py-3 text-xs text-slate-400">{item.category || 'Medication'}</td>
                        <td className="py-3 font-medium text-amber-300">{item.quantity}</td>
                        <td className="py-3 text-xs font-semibold text-red-300">
                          {item.expiration_date ? new Date(item.expiration_date).toLocaleDateString(document.documentElement.lang || undefined) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button onClick={() => navigate('/sales')} className="btn-primary justify-between p-4 text-sm font-semibold">
              <span className="flex items-center gap-2"><ShoppingCart size={18} /> {t('newPharmacySale')}</span>
              <ArrowRight size={14} />
            </button>
            <button onClick={() => navigate('/products')} className="btn-ghost justify-between p-4 text-sm font-semibold">
              <span className="flex items-center gap-2"><Package size={18} /> {t('medicationsInventory')}</span>
              <ArrowRight size={14} />
            </button>
            <button onClick={() => navigate('/ai/scanner')} className="btn-ghost justify-between p-4 text-sm font-semibold">
              <span className="flex items-center gap-2"><ScanLine size={18} /> {t('aiInvoiceScan')}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// 4. Supérette & Supermarket Dashboard
function SuperetteDashboard() {
  const { company } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const currency = company?.currency || 'DZD';

  useEffect(() => {
    let cancelled = false;
    getSuperetteDashboard()
      .then((d) => !cancelled && setStats(d))
      .catch((e) => console.error(e))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <HeroBanner
        title={company?.name || t('businessTypeGrocery')}
        subtitle={t('businessTypeGroceryDesc')}
        icon={ShoppingCart}
        badge={t('businessTypeGrocery')}
        bgImage="https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1600&q=80"
        statusChips={[
          "🛒 " + (t('posReady') || 'POS Terminals Ready'),
          "📦 " + (t('barcodeScan') || 'Live Inventory Flow'),
          "💳 " + (t('creditLedger') || 'Customer Credit Active'),
        ]}
      />

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={32} /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Wallet} tone="teal" label={t('todayRevenue')} value={formatMoney(stats?.todayRevenue, currency)} sublabel={t('salesAndPos')} onClick={() => navigate('/sales')} />
            <StatCard icon={ShoppingCart} tone="blue" label={t('transactionsToday')} value={stats?.salesCount ?? 0} sublabel={t('today')} onClick={() => navigate('/sales')} />
            <StatCard icon={AlertTriangle} tone="amber" highlight label={t('lowStock')} value={stats?.lowStockCount ?? 0} sublabel={t('minStock')} onClick={() => navigate('/products')} />
            <StatCard icon={Star} tone="violet" label={t('creditDueFromCustomers')} value={formatMoney(stats?.totalCreditDue, currency)} sublabel={t('creditLedger')} onClick={() => navigate('/credit')} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button onClick={() => navigate('/sales')} className="btn-primary justify-between p-4 text-sm font-semibold">
              <span className="flex items-center gap-2"><ShoppingCart size={18} /> {t('quickPosSale')}</span>
              <ArrowRight size={14} />
            </button>
            <button onClick={() => navigate('/products')} className="btn-ghost justify-between p-4 text-sm font-semibold">
              <span className="flex items-center gap-2"><Package size={18} /> {t('productsAndStock')}</span>
              <ArrowRight size={14} />
            </button>
            <button onClick={() => navigate('/credit')} className="btn-ghost justify-between p-4 text-sm font-semibold">
              <span className="flex items-center gap-2"><ClipboardList size={18} /> {t('creditLedger')}</span>
              <ArrowRight size={14} />
            </button>
            <button onClick={() => navigate('/ai/scanner')} className="btn-ghost justify-between p-4 text-sm font-semibold">
              <span className="flex items-center gap-2"><ScanLine size={18} /> {t('aiInvoiceScan')}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// 5. Clothing Store Dashboard
function ClothingDashboard() {
  const { company } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const currency = company?.currency || 'DZD';

  useEffect(() => {
    let cancelled = false;
    getClothingDashboard()
      .then((d) => !cancelled && setStats(d))
      .catch((e) => console.error(e))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <HeroBanner
        title={company?.name || t('businessTypeClothing')}
        subtitle={t('businessTypeClothingDesc')}
        icon={Package}
        badge={t('businessTypeClothing')}
        bgImage="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80"
        statusChips={[
          "👗 " + (t('boutiqueShowroom') || 'Fashion Showroom Active'),
          "🏷️ " + (t('sizesColors') || 'Sizes & Colors Variants'),
          "✨ " + (t('newSeason') || 'Seasonal Collection Ready'),
        ]}
      />

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={32} /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Wallet} tone="teal" label={t('todayRevenue')} value={formatMoney(stats?.todayRevenue, currency)} sublabel={t('salesAndPos')} onClick={() => navigate('/sales')} />
            <StatCard icon={Package} tone="blue" label={t('totalGarmentsInStock')} value={stats?.totalPiecesInStock ?? 0} sublabel={t('productsAndStock')} onClick={() => navigate('/products')} />
            <StatCard icon={Star} tone="violet" label={t('uniqueModelsVariants')} value={stats?.totalVariants ?? 0} sublabel={t('productsAndStock')} onClick={() => navigate('/products')} />
            <StatCard icon={AlertTriangle} tone="amber" highlight label={t('lowStockModels')} value={stats?.lowStockCount ?? 0} sublabel={t('minStock')} onClick={() => navigate('/products')} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button onClick={() => navigate('/sales')} className="btn-primary justify-between p-4 text-sm font-semibold">
              <span className="flex items-center gap-2"><ShoppingCart size={18} /> {t('newGarmentSale')}</span>
              <ArrowRight size={14} />
            </button>
            <button onClick={() => navigate('/products')} className="btn-ghost justify-between p-4 text-sm font-semibold">
              <span className="flex items-center gap-2"><Package size={18} /> {t('manageClothesSizes')}</span>
              <ArrowRight size={14} />
            </button>
            <button onClick={() => navigate('/ai/scanner')} className="btn-ghost justify-between p-4 text-sm font-semibold">
              <span className="flex items-center gap-2"><ScanLine size={18} /> {t('aiInvoiceScan')}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// 6. Enterprise / Company Dashboard
function EnterpriseDashboard() {
  const { company } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const currency = company?.currency || 'DZD';

  useEffect(() => {
    let cancelled = false;
    getEnterpriseDashboard()
      .then((d) => !cancelled && setStats(d))
      .catch((e) => console.error(e))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <HeroBanner
        title={company?.name || t('businessTypeCompany')}
        subtitle={t('businessTypeCompanyDesc')}
        icon={Building2}
        badge={t('businessTypeCompany')}
        bgImage="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80"
        statusChips={[
          "📊 " + (t('operationsOnline') || 'Enterprise Operations Live'),
          "💼 " + (t('clientBilling') || 'Corporate Invoicing Active'),
          "👥 " + (t('teamMilestones') || 'Staff & Deliverables Tracked'),
        ]}
      />

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={32} /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={FolderKanban} tone="blue" label={t('activeProjects')} value={stats?.activeProjectsCount ?? 0} sublabel={t('projects')} onClick={() => navigate('/enterprise/projects')} />
            <StatCard icon={Wallet} tone="teal" label={t('monthlyInvoiced')} value={formatMoney(stats?.monthlyRevenue, currency)} sublabel={t('moreInvoices')} onClick={() => navigate('/invoices')} />
            <StatCard icon={Users} tone="violet" label={t('monthlyPayroll')} value={formatMoney(stats?.monthlyPayroll, currency)} sublabel={t('employeesPayroll')} onClick={() => navigate('/employees')} />
            <StatCard icon={Activity} tone="amber" highlight label={t('monthlyExpenses')} value={formatMoney(stats?.monthlyExpenses, currency)} sublabel={t('moreExpenses')} onClick={() => navigate('/expenses')} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button onClick={() => navigate('/enterprise/projects')} className="btn-primary justify-between p-4 text-sm font-semibold">
              <span className="flex items-center gap-2"><FolderKanban size={18} /> {t('manageProjects')}</span>
              <ArrowRight size={14} />
            </button>
            <button onClick={() => navigate('/invoices')} className="btn-ghost justify-between p-4 text-sm font-semibold">
              <span className="flex items-center gap-2"><Wallet size={18} /> {t('clientInvoices')}</span>
              <ArrowRight size={14} />
            </button>
            <button onClick={() => navigate('/employees')} className="btn-ghost justify-between p-4 text-sm font-semibold">
              <span className="flex items-center gap-2"><Users size={18} /> {t('employeesPayroll')}</span>
              <ArrowRight size={14} />
            </button>
            <button onClick={() => navigate('/ai/assistant')} className="btn-ghost justify-between p-4 text-sm font-semibold">
              <span className="flex items-center gap-2"><Activity size={18} /> {t('aiBusinessConsultant')}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// 7. Generic Core Dashboard
function GenericCoreDashboard() {
  const { company } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const currency = company?.currency || 'DZD';

  useEffect(() => {
    let cancelled = false;
    getDashboardSummary()
      .then((d) => !cancelled && setStats(d))
      .catch((e) => console.error(e))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <HeroBanner
        title={company?.name || t('generalBusiness') || 'Your Business'}
        subtitle={t('genericCoreSubtitle') || "Complete overview of today's performance, operations, and financial metrics."}
        icon={Building2}
        badge={t('generalBusiness') || 'General Business'}
        bgImage="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80"
        statusChips={[
          "📈 " + (t('biLive') || 'Business Intelligence Live'),
          "💼 " + (t('ledgerSynced') || 'Financial Ledger Grounded'),
          "🤖 " + (t('aiConsultant') || 'AI Consultant Online'),
        ]}
      />

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={32} /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard icon={Wallet} tone="teal" label={t('today') + ' ' + (t('revenue') || 'Revenue')} value={formatMoney(stats?.todayRevenue, currency)} sublabel={t('revenue')} onClick={() => navigate('/sales')} />
            <StatCard icon={Activity} tone="violet" label={t('today') + ' ' + (t('moreExpenses') || 'Expenses')} value={formatMoney(stats?.todayExpenses, currency)} sublabel={t('moreExpenses')} onClick={() => navigate('/expenses')} />
            <StatCard icon={Star} tone="blue" label={t('today') + ' ' + (t('profit') || 'Profit')} value={formatMoney(stats?.todayProfit, currency)} sublabel={t('profit')} onClick={() => navigate('/reports')} />
            <StatCard icon={ShoppingCart} tone="amber" label={t('salesAndPos') || 'Sales Today'} value={stats?.salesCount ?? 0} sublabel={t('today')} onClick={() => navigate('/sales')} />
            <StatCard icon={Package} tone="blue" label={t('lowStock') || 'Low Stock Products'} value={stats?.lowStockCount ?? 0} sublabel={t('minStock')} onClick={() => navigate('/products')} />
            <StatCard icon={CalendarClock} tone="violet" label={t('unpaid') + ' ' + (t('moreInvoices') || 'Invoices')} value={stats?.unpaidInvoicesCount ?? 0} sublabel={t('unpaid')} onClick={() => navigate('/invoices')} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button onClick={() => navigate('/sales')} className="btn-primary justify-between p-4 text-sm font-semibold">
              <span className="flex items-center gap-2"><ShoppingCart size={18} /> {t('newSale') || 'New Sale'}</span>
              <ArrowRight size={14} />
            </button>
            <button onClick={() => navigate('/products')} className="btn-ghost justify-between p-4 text-sm font-semibold">
              <span className="flex items-center gap-2"><Package size={18} /> {t('productsAndStock') || 'Products & Stock'}</span>
              <ArrowRight size={14} />
            </button>
            <button onClick={() => navigate('/expenses')} className="btn-ghost justify-between p-4 text-sm font-semibold">
              <span className="flex items-center gap-2"><Wallet size={18} /> {t('moreExpenses') || 'Expenses'}</span>
              <ArrowRight size={14} />
            </button>
            <button onClick={() => navigate('/ai/assistant')} className="btn-ghost justify-between p-4 text-sm font-semibold">
              <span className="flex items-center gap-2"><Activity size={18} /> {t('moreAiAssistant') || 'AI Assistant'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { company } = useAuth();
  const type = company?.business_type;

  switch (type) {
    case 'restaurant':
    case 'cafe':
      return <RestaurantDashboard />;
    case 'clinic':
    case 'dental_clinic':
      return <ClinicDashboard />;
    case 'pharmacy':
      return <PharmacyDashboard />;
    case 'grocery':
    case 'supermarket':
    case 'retail_store':
      return <SuperetteDashboard />;
    case 'clothing':
      return <ClothingDashboard />;
    case 'company':
      return <EnterpriseDashboard />;
    default:
      return <GenericCoreDashboard />;
  }
}
