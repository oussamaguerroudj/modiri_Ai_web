import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  Wallet,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Package,
  Layers,
  Users,
  ChevronLeft,
  ChevronRight,
  Receipt,
  FileText,
  DollarSign,
  AlertCircle,
  Clock,
  Briefcase,
} from 'lucide-react';
import { getReportsSummary } from '../../api/reports';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { formatMoney } from '../../utils/currency.js';
import Spinner from '../../components/ui/Spinner.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import Alert from '../../components/ui/Alert.jsx';

export default function ReportsPage() {
  const { company } = useAuth();
  const { t, isRtl } = useLanguage();
  const currency = company?.currency || 'DZD';

  // Three primary reporting modes: daily, monthly, yearly
  const [period, setPeriod] = useState('monthly'); // 'daily' | 'monthly' | 'yearly'

  // Selected date states
  const today = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const thisMonth = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, []);

  const thisYear = useMemo(() => new Date().getFullYear(), []);

  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedMonth, setSelectedMonth] = useState(thisMonth);
  const [selectedYear, setSelectedYear] = useState(thisYear);

  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Date manipulation helpers
  const handlePrevDate = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${day}`);
  };

  const handleNextDate = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${day}`);
  };

  const handlePrevMonth = () => {
    const [yStr, mStr] = selectedMonth.split('-');
    let y = parseInt(yStr, 10);
    let m = parseInt(mStr, 10) - 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    setSelectedMonth(`${y}-${String(m).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [yStr, mStr] = selectedMonth.split('-');
    let y = parseInt(yStr, 10);
    let m = parseInt(mStr, 10) + 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    setSelectedMonth(`${y}-${String(m).padStart(2, '0')}`);
  };

  const handlePrevYear = () => {
    setSelectedYear((y) => y - 1);
  };

  const handleNextYear = () => {
    setSelectedYear((y) => y + 1);
  };

  // Build query params based on selected mode and date
  const queryParams = useMemo(() => {
    if (period === 'daily') {
      return { period: 'daily', date: selectedDate };
    } else if (period === 'monthly') {
      return { period: 'monthly', month: selectedMonth };
    } else {
      return { period: 'yearly', year: selectedYear };
    }
  }, [period, selectedDate, selectedMonth, selectedYear]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getReportsSummary(queryParams);
      setReports(data);
    } catch (err) {
      setError(err.message || 'Failed to load business reports');
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 1. GLOBAL / ALL-TIME VALUES (unfiltered, represents ALL transactions in database)
  const allRevenue = Number(reports?.global?.allRevenue ?? reports?.allRevenue) || 0;
  const allExpenses = Number(reports?.global?.allExpenses ?? reports?.allExpenses) || 0;
  const globalNetProfit = Number(reports?.global?.globalNetProfit ?? reports?.globalNetProfit) || (allRevenue - allExpenses);

  // 2. PERIOD-SPECIFIC CALCULATIONS (strictly for selected day, month, or year)
  const periodRevenue = Number(reports?.revenue ?? reports?.totalRevenue) || 0;
  const periodExpenses = Number(reports?.expenses ?? reports?.totalExpenses) || 0;
  const periodOperatingExpenses = Number(reports?.operatingExpenses ?? reports?.expensesBreakdown?.operatingExpenses) || 0;
  const periodSalaryExpenses = Number(reports?.employeeSalaries ?? reports?.expensesBreakdown?.employeeSalaries) || 0;
  const periodNetProfit = Number(reports?.netProfit ?? reports?.profit) || (periodRevenue - periodExpenses);
  const profitMargin = reports?.profitMargin ?? (periodRevenue > 0 ? ((periodNetProfit / periodRevenue) * 100).toFixed(1) : 0);
  const salesCount = Number(reports?.salesCount ?? reports?.totalSales) || 0;

  // Breakdown details
  const topProducts = reports?.topProducts || reports?.topSelling || [];
  const expensesByCategory = reports?.expensesByCategory || reports?.expensesBreakdown?.byCategory || [];
  const employeeSalariesBreakdown = reports?.employeeSalariesBreakdown || reports?.expensesBreakdown?.byEmployee || [];
  const monthlyBreakdown = reports?.monthlyBreakdown || [];
  const recentTransactions = reports?.recentTransactions || [];

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="text-brand-blue" />
            {t('moreReports')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t('allTimeOverview')} · {t('periodReport')}
          </p>
        </div>
      </div>

      {error ? (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={loadData}
            className="px-3 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-xs font-semibold"
          >
            {t('retry') || 'Retry'}
          </button>
        </div>
      ) : null}

      {/* ======================================================== */}
      {/* 1. GLOBAL / ALL-TIME NET PROFIT BANNER CARD              */}
      {/* Represents ALL transactions currently recorded in the DB */}
      {/* Does NOT change when switching day, month, or year       */}
      {/* ======================================================== */}
      <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-ink-900 via-ink-950 to-brand-blue/10 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-blue/20 text-brand-blue border border-brand-blue/30">
              <span className="w-2 h-2 rounded-full bg-brand-blue animate-pulse" />
              {t('allTimeOverview')}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {t('globalNetProfit')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              {t('globalNetProfitDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 bg-ink-950/60 p-4 sm:p-5 rounded-xl border border-line/50">
            <div>
              <p className="text-xs font-medium text-slate-400">{t('allRevenue')}</p>
              <p className="text-lg sm:text-xl font-bold font-mono text-emerald-400 mt-1">
                {formatMoney(allRevenue, currency)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">{t('allExpenses')}</p>
              <p className="text-lg sm:text-xl font-bold font-mono text-amber-400 mt-1">
                {formatMoney(allExpenses, currency)}
              </p>
            </div>
            <div className="sm:border-l sm:border-line/60 sm:pl-6 sm:rtl:border-l-0 sm:rtl:border-r sm:rtl:pr-6">
              <p className="text-xs font-medium text-slate-400">{t('globalNetProfit')}</p>
              <p
                className={`text-xl sm:text-2xl font-extrabold font-mono mt-1 ${
                  globalNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {formatMoney(globalNetProfit, currency)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. REPORT PERIOD SWITCHER & SELECTORS                    */}
      {/* Daily | Monthly | Yearly                                 */}
      {/* ======================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl border border-line bg-ink-900 self-start sm:self-auto">
            <button
              onClick={() => setPeriod('daily')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                period === 'daily'
                  ? 'bg-brand-gradient text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('periodDaily')}
            </button>
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                period === 'monthly'
                  ? 'bg-brand-gradient text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('periodMonthly')}
            </button>
            <button
              onClick={() => setPeriod('yearly')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                period === 'yearly'
                  ? 'bg-brand-gradient text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('periodYearly')}
            </button>
          </div>

          {/* Integrated Selector Controls */}
          <div className="flex items-center gap-2">
            {period === 'daily' && (
              <div className="flex items-center gap-2 bg-ink-900 p-1.5 rounded-xl border border-line">
                <button
                  onClick={handlePrevDate}
                  title={t('prevDay')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-ink-800 transition"
                >
                  <ChevronLeft size={18} className={isRtl ? 'rotate-180' : ''} />
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-xs sm:text-sm font-semibold text-white px-2 py-1 outline-none cursor-pointer"
                />
                <button
                  onClick={handleNextDate}
                  title={t('nextDay')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-ink-800 transition"
                >
                  <ChevronRight size={18} className={isRtl ? 'rotate-180' : ''} />
                </button>
                <button
                  onClick={() => setSelectedDate(today)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-brand-blue/20 text-brand-blue hover:bg-brand-blue/30 transition"
                >
                  {t('todayBtn')}
                </button>
              </div>
            )}

            {period === 'monthly' && (
              <div className="flex items-center gap-2 bg-ink-900 p-1.5 rounded-xl border border-line">
                <button
                  onClick={handlePrevMonth}
                  title={t('prevMonth')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-ink-800 transition"
                >
                  <ChevronLeft size={18} className={isRtl ? 'rotate-180' : ''} />
                </button>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-xs sm:text-sm font-semibold text-white px-2 py-1 outline-none cursor-pointer"
                />
                <button
                  onClick={handleNextMonth}
                  title={t('nextMonth')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-ink-800 transition"
                >
                  <ChevronRight size={18} className={isRtl ? 'rotate-180' : ''} />
                </button>
                <button
                  onClick={() => setSelectedMonth(thisMonth)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-brand-blue/20 text-brand-blue hover:bg-brand-blue/30 transition"
                >
                  {t('thisMonthBtn')}
                </button>
              </div>
            )}

            {period === 'yearly' && (
              <div className="flex items-center gap-2 bg-ink-900 p-1.5 rounded-xl border border-line">
                <button
                  onClick={handlePrevYear}
                  title={t('prevYear')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-ink-800 transition"
                >
                  <ChevronLeft size={18} className={isRtl ? 'rotate-180' : ''} />
                </button>
                <div className="px-3 py-1 text-sm font-bold text-white font-mono">
                  {selectedYear}
                </div>
                <button
                  onClick={handleNextYear}
                  title={t('nextYear')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-ink-800 transition"
                >
                  <ChevronRight size={18} className={isRtl ? 'rotate-180' : ''} />
                </button>
                <button
                  onClick={() => setSelectedYear(thisYear)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-brand-blue/20 text-brand-blue hover:bg-brand-blue/30 transition"
                >
                  {t('thisYearBtn')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Selected Period Active Badge */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="flex items-center gap-1.5">
            <Calendar size={14} className="text-brand-blue" />
            <span className="font-semibold text-slate-300">
              {period === 'daily' && `${t('periodDaily')}: ${selectedDate}`}
              {period === 'monthly' && `${t('periodMonthly')}: ${selectedMonth}`}
              {period === 'yearly' && `${t('periodYearly')}: ${selectedYear}`}
            </span>
          </span>
          <span className="font-mono text-xs">
            {reports?.rangeStart && reports?.rangeEnd ? `${reports.rangeStart} → ${reports.rangeEnd}` : ''}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner size={36} />
        </div>
      ) : (
        <div className="space-y-8">
          {/* ======================================================== */}
          {/* 3. PERIOD FINANCIAL KPI CARDS                             */}
          {/* Calculated strictly from actual transactions in period   */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Wallet}
              tone="teal"
              label={`${t('periodReport')} — ${t('totalRevenue')}`}
              value={formatMoney(periodRevenue, currency)}
              sublabel={`${salesCount} ${t('salesAndPos') || 'Transactions'}`}
            />
            <StatCard
              icon={TrendingDown}
              tone="amber"
              label={`${t('periodReport')} — ${t('totalExpenses')}`}
              value={formatMoney(periodExpenses, currency)}
              sublabel={`${t('operatingExpenses')}: ${formatMoney(periodOperatingExpenses, currency)}`}
            />
            <StatCard
              icon={Users}
              tone="violet"
              label={t('salaryExpenses')}
              value={formatMoney(periodSalaryExpenses, currency)}
              sublabel={
                employeeSalariesBreakdown.length > 0
                  ? `${employeeSalariesBreakdown.length} ${t('moreEmployees')}`
                  : `${t('actualTransactionsOnly') || 'Actual payments'}`
              }
            />
            <StatCard
              icon={TrendingUp}
              tone={periodNetProfit >= 0 ? 'emerald' : 'rose'}
              highlight
              label={`${t('periodReport')} — ${t('netProfit')}`}
              value={formatMoney(periodNetProfit, currency)}
              sublabel={`${t('profitMargin')}: ${profitMargin}%`}
            />
          </div>

          {/* ======================================================== */}
          {/* 4. EXPENSE BREAKDOWN & REVENUE DETAILS                   */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products / Revenue Sources */}
            <div className="panel p-6">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Package size={18} className="text-brand-blue" />
                {t('productsAndStock')} ({t('periodReport')})
              </h2>

              {topProducts.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  {t('noData')}
                </div>
              ) : (
                <div className="space-y-3">
                  {topProducts.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl border border-line bg-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-blue/20 text-brand-blue font-bold text-xs">
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {p.name || p.product_name}
                          </p>
                          <p className="text-xs text-slate-400 font-mono">
                            {p.units_sold || p.quantity || 0} {t('stock')}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-sm text-emerald-400">
                        {formatMoney(p.total || p.revenue || 0, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Operating Expenses by Category */}
            <div className="panel p-6">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Layers size={18} className="text-brand-violet" />
                {t('moreExpenses')} ({t('category')})
              </h2>

              {expensesByCategory.length === 0 && periodSalaryExpenses === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  {t('noExpensesYet')}
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Operating Expense Categories */}
                  {expensesByCategory.map((c, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl border border-line bg-white/5"
                    >
                      <span className="text-sm font-medium text-slate-200">
                        {c.category}
                      </span>
                      <span className="font-mono font-bold text-sm text-amber-400">
                        {formatMoney(c.amount || c.total || 0, currency)}
                      </span>
                    </div>
                  ))}

                  {/* Salary Total in Breakdown */}
                  {periodSalaryExpenses > 0 && (
                    <div className="flex items-center justify-between p-3 rounded-xl border border-violet-500/30 bg-violet-500/10">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-violet-400" />
                        <span className="text-sm font-semibold text-violet-200">
                          {t('salaryExpenses')}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-sm text-violet-300">
                        {formatMoney(periodSalaryExpenses, currency)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ======================================================== */}
          {/* 5. YEARLY MONTHLY BREAKDOWN TABLE (When mode === 'yearly')*/}
          {/* Shows actual transactions for January through December   */}
          {/* ======================================================== */}
          {period === 'yearly' && monthlyBreakdown.length > 0 && (
            <div className="panel p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar size={18} className="text-brand-blue" />
                  {t('monthlyBreakdown')} ({selectedYear})
                </h2>
                <span className="text-xs text-slate-400">
                  {t('actualTransactionsOnly') || 'SUM(actual transactions per month)'}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs rtl:text-right">
                  <thead>
                    <tr className="border-b border-line text-slate-400 font-semibold">
                      <th className="pb-3 px-3">{t('month') || 'Month'}</th>
                      <th className="pb-3 px-3 text-right rtl:text-left">{t('totalRevenue')}</th>
                      <th className="pb-3 px-3 text-right rtl:text-left">{t('operatingExpenses')}</th>
                      <th className="pb-3 px-3 text-right rtl:text-left">{t('salaryExpenses')}</th>
                      <th className="pb-3 px-3 text-right rtl:text-left">{t('totalExpenses')}</th>
                      <th className="pb-3 px-3 text-right rtl:text-left">{t('netProfit')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/40">
                    {monthlyBreakdown.map((m) => {
                      const hasActivity = m.revenue > 0 || m.expenses > 0;
                      return (
                        <tr
                          key={m.month}
                          className={`hover:bg-white/5 transition ${
                            hasActivity ? 'text-white' : 'text-slate-500'
                          }`}
                        >
                          <td className="py-3 px-3 font-semibold">
                            {m.monthName}
                          </td>
                          <td className="py-3 px-3 text-right rtl:text-left font-mono text-emerald-400">
                            {formatMoney(m.revenue, currency)}
                          </td>
                          <td className="py-3 px-3 text-right rtl:text-left font-mono text-slate-300">
                            {formatMoney(m.operatingExpenses, currency)}
                          </td>
                          <td className="py-3 px-3 text-right rtl:text-left font-mono text-violet-300">
                            {formatMoney(m.salaryExpenses, currency)}
                          </td>
                          <td className="py-3 px-3 text-right rtl:text-left font-mono text-amber-400 font-bold">
                            {formatMoney(m.expenses, currency)}
                          </td>
                          <td
                            className={`py-3 px-3 text-right rtl:text-left font-mono font-bold ${
                              m.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {formatMoney(m.netProfit, currency)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-line text-white font-bold">
                      <td className="py-3 px-3">{t('allExpenses') || 'Total'}</td>
                      <td className="py-3 px-3 text-right rtl:text-left font-mono text-emerald-400">
                        {formatMoney(periodRevenue, currency)}
                      </td>
                      <td className="py-3 px-3 text-right rtl:text-left font-mono text-slate-200">
                        {formatMoney(periodOperatingExpenses, currency)}
                      </td>
                      <td className="py-3 px-3 text-right rtl:text-left font-mono text-violet-300">
                        {formatMoney(periodSalaryExpenses, currency)}
                      </td>
                      <td className="py-3 px-3 text-right rtl:text-left font-mono text-amber-400">
                        {formatMoney(periodExpenses, currency)}
                      </td>
                      <td
                        className={`py-3 px-3 text-right rtl:text-left font-mono ${
                          periodNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {formatMoney(periodNetProfit, currency)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 6. ACTUAL TRANSACTIONS LIST FOR SELECTED PERIOD          */}
          {/* Sourced directly from the database                       */}
          {/* ======================================================== */}
          <div className="panel p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Receipt size={18} className="text-brand-blue" />
                  {t('transactionList')}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {recentTransactions.length}{' '}
                  {recentTransactions.length === 1 ? 'transaction' : 'transactions'}
                </p>
              </div>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-line rounded-xl">
                <Receipt size={32} className="mx-auto text-slate-500 mb-2" />
                <p className="text-sm font-semibold text-slate-300">
                  {t('noTransactionsPeriod')}
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Revenue: {formatMoney(0, currency)} · Expenses: {formatMoney(0, currency)}.
                  Transactions must be explicitly recorded before they appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-line/40">
                {recentTransactions.map((tx) => {
                  const isSale = tx.type === 'sale';
                  const isSalary = tx.type === 'salary';

                  let badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                  let badgeLabel = tx.status || 'Expense';
                  if (isSale) {
                    badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                    badgeLabel = 'Revenue';
                  } else if (isSalary) {
                    badgeColor = 'bg-violet-500/20 text-violet-300 border-violet-500/30';
                    badgeLabel = 'Salary';
                  }

                  const txDate = tx.date ? new Date(tx.date).toLocaleDateString() : '';

                  return (
                    <div
                      key={tx.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/5 px-2 rounded-lg transition"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg border ${badgeColor}`}
                        >
                          {isSale ? (
                            <DollarSign size={16} />
                          ) : isSalary ? (
                            <Briefcase size={16} />
                          ) : (
                            <Receipt size={16} />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-white">
                              {tx.title}
                            </p>
                            <span
                              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}
                            >
                              {badgeLabel}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400">
                            {txDate && (
                              <span className="flex items-center gap-1 font-mono">
                                <Clock size={12} />
                                {txDate}
                              </span>
                            )}
                            {tx.employeeName && (
                              <span className="text-violet-300 font-medium">
                                {t('employee')}: {tx.employeeName}
                              </span>
                            )}
                            {tx.salaryPeriod && (
                              <span className="text-slate-400 font-mono">
                                {t('salaryPeriod')}: {tx.salaryPeriod}
                              </span>
                            )}
                            {tx.duration && (
                              <span className="text-slate-400">
                                {t('duration')}: {tx.duration}
                              </span>
                            )}
                            {tx.description && (
                              <span className="text-slate-400 italic">
                                "{tx.description}"
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right rtl:text-left self-end sm:self-center">
                        <p
                          className={`text-sm sm:text-base font-bold font-mono ${
                            isSale ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {isSale ? '+' : '-'}
                          {formatMoney(tx.amount, currency)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
