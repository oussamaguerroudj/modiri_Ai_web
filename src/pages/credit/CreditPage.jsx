import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  User,
  CreditCard,
  DollarSign,
  History,
  X,
  Check,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import {
  getCreditSummary,
  getCreditPurchases,
  recordCreditPayment,
  getCustomerCreditTransactions,
} from '../../api/credit';
import { getCustomers } from '../../api/customers';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { formatMoney } from '../../utils/currency.js';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Alert from '../../components/ui/Alert.jsx';
import StatCard from '../../components/ui/StatCard.jsx';

export default function CreditPage() {
  const { company } = useAuth();
  const { t } = useLanguage();
  const currency = company?.currency || 'DZD';

  const [summary, setSummary] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Payment Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // History Modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyCustomer, setHistoryCustomer] = useState(null);
  const [historyTransactions, setHistoryTransactions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumData, purchData, custData] = await Promise.all([
        getCreditSummary(),
        getCreditPurchases(),
        getCustomers(),
      ]);
      setSummary(sumData);
      setPurchases(purchData);
      setCustomers(custData);
    } catch (err) {
      setError(err.message || 'Failed to load credit records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleRecordPayment(e) {
    e.preventDefault();
    if (!selectedCustomerId || !paymentAmount) {
      alert('Please select a customer and enter payment amount.');
      return;
    }
    setSubmittingPayment(true);
    try {
      await recordCreditPayment({
        customerId: selectedCustomerId,
        amount: Number(paymentAmount),
        note: paymentNote.trim() || undefined,
      });
      setPaymentModalOpen(false);
      setPaymentAmount('');
      setPaymentNote('');
      loadData();
    } catch (err) {
      alert(`Payment failed: ${err.message}`);
    } finally {
      setSubmittingPayment(false);
    }
  }

  async function openHistoryModal(customer) {
    setHistoryCustomer(customer);
    setHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
      const txs = await getCustomerCreditTransactions(customer.id);
      setHistoryTransactions(txs);
    } catch (err) {
      alert(`Failed to load history: ${err.message}`);
    } finally {
      setLoadingHistory(false);
    }
  }

  // Filter customers with active balances
  const customersWithDebt = customers.filter(
    (c) => (Number(c.balance_due) || Number(c.balanceDue) || 0) > 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <BookOpen className="text-brand-blue" />
            {t('creditLedger')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t('creditDueFromCustomers')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSelectedCustomerId('');
            setPaymentAmount('');
            setPaymentNote('');
            setPaymentModalOpen(true);
          }}
          className="btn-primary self-start sm:self-auto py-2.5 px-4 text-sm font-semibold flex items-center gap-2 shadow-lg shadow-brand-blue/20"
        >
          <DollarSign size={18} />
          {t('payDebt')}
        </button>
      </div>

      {error ? <div className="panel border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div> : null}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={AlertCircle}
          tone="amber"
          highlight
          label={t('creditDueFromCustomers')}
          value={formatMoney(summary?.totalOutstanding ?? summary?.totalBalanceDue ?? 0, currency)}
          sublabel={t('debt')}
        />
        <StatCard
          icon={User}
          tone="blue"
          label={t('moreCustomers')}
          value={customersWithDebt.length}
          sublabel={t('debt')}
        />
        <StatCard
          icon={CreditCard}
          tone="teal"
          label={t('total')}
          value={formatMoney(summary?.totalCreditSales ?? purchases.reduce((a, p) => a + Number(p.amount || 0), 0), currency)}
          sublabel={t('credit')}
        />
      </div>

      {/* Debtors List */}
      <div className="panel p-6">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <User size={18} className="text-brand-blue" />
          {t('moreCustomers')} — {t('debt')}
        </h2>

        {loading ? (
          <div className="flex justify-center py-10"><Spinner size={24} /></div>
        ) : customersWithDebt.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">{t('noData')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs font-semibold text-slate-400 uppercase">
                <tr>
                  <th className="pb-3 px-3">{t('customer')}</th>
                  <th className="pb-3 px-3">{t('phone')}</th>
                  <th className="pb-3 px-3 font-mono">{t('debt')}</th>
                  <th className="pb-3 px-3 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-slate-300">
                {customersWithDebt.map((cust) => {
                  const debt = Number(cust.balance_due ?? cust.balanceDue) || 0;
                  return (
                    <tr key={cust.id} className="hover:bg-white/5 transition">
                      <td className="py-3 px-3 font-semibold text-white">{cust.name}</td>
                      <td className="py-3 px-3 text-xs text-slate-400">{cust.phone || '—'}</td>
                      <td className="py-3 px-3 font-mono font-bold text-red-400">{formatMoney(debt, currency)}</td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustomerId(cust.id);
                              setPaymentAmount(debt.toString());
                              setPaymentModalOpen(true);
                            }}
                            className="btn-primary py-1 px-3 text-xs font-semibold"
                          >
                            {t('payDebt')}
                          </button>
                          <button
                            type="button"
                            onClick={() => openHistoryModal(cust)}
                            className="btn-ghost py-1 px-3 text-xs font-semibold flex items-center gap-1"
                          >
                            <History size={13} /> {t('details')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Repayment Modal */}
      {paymentModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-line bg-ink-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <DollarSign size={18} className="text-brand-blue" />
                {t('payDebt')}
              </h3>
              <button onClick={() => setPaymentModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">{t('customer')} *</label>
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="input-field py-2 text-sm"
                >
                  <option value="">{t('searchPlaceholder')}</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id} className="bg-ink-900 text-white">
                      {c.name} — {t('debt')}: {formatMoney(c.balance_due ?? c.balanceDue ?? 0, currency)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  {t('amount')} ({currency}) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={t('exampleAmount')}
                  className="input-field py-2 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  {t('notes')}
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder={t('notesPlaceholder')}
                  className="input-field py-2 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="btn-ghost py-2 px-4 text-xs font-semibold"
                >
                  {t('close')}
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="btn-primary py-2 px-5 text-xs font-semibold flex items-center gap-1.5"
                >
                  {submittingPayment ? <Spinner size={16} /> : <Check size={16} />}
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Customer Credit History Modal */}
      {historyModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-2xl border border-line bg-ink-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <History size={18} className="text-brand-blue" />
                  {t('customerDetails')} — {historyCustomer?.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t('debt')}: {formatMoney(historyCustomer?.balance_due ?? historyCustomer?.balanceDue ?? 0, currency)}
                </p>
              </div>
              <button onClick={() => setHistoryModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {loadingHistory ? (
              <div className="flex justify-center py-10"><Spinner size={24} /></div>
            ) : historyTransactions.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">{t('noData')}</p>
            ) : (
              <div className="max-h-80 overflow-y-auto pr-1 space-y-2">
                {historyTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-line bg-white/5 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-white capitalize">{tx.type} — {tx.note || tx.notes || 'Transaction'}</p>
                      <p className="text-[11px] text-slate-400">{new Date(tx.created_at).toLocaleString(document.documentElement.lang || undefined)}</p>
                    </div>
                    <span
                      className={`font-mono font-bold text-sm ${
                        tx.type === 'payment' ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {tx.type === 'payment' ? '-' : '+'}{formatMoney(tx.amount, currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
