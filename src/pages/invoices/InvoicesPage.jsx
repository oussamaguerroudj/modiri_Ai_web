import { useState, useEffect, useCallback } from 'react';
import {
  Receipt,
  CheckCircle,
  Eye,
  X,
  FileText,
  User,
  Clock,
  Printer,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import {
  getInvoices,
  getInvoiceById,
  markInvoicePaid,
} from '../../api/invoices';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { formatMoney } from '../../utils/currency.js';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Alert from '../../components/ui/Alert.jsx';

export default function InvoicesPage() {
  const { company } = useAuth();
  const { t } = useLanguage();
  const currency = company?.currency || 'DZD';

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewInvoice, setViewInvoice] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getInvoices();
      setInvoices(data);
    } catch (err) {
      setError(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleMarkPaid(id) {
    try {
      await markInvoicePaid(id);
      await loadData();
      if (viewInvoice && viewInvoice.id === id) {
        const refreshedInvoice = await getInvoiceById(id);
        setViewInvoice(refreshedInvoice);
      }
    } catch (err) {
      alert(`Could not mark invoice as paid: ${err.message}`);
    }
  }

  async function handleView(id) {
    setLoadingDetails(true);
    setViewInvoice(null);
    try {
      const inv = await getInvoiceById(id);
      setViewInvoice(inv);
    } catch (err) {
      alert(`Could not load invoice details: ${err.message}`);
    } finally {
      setLoadingDetails(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Receipt className="text-brand-blue" />
            {t('moreInvoices') || 'Billing & Invoices'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t('navDashboard')}: {t('invoiceDetails')}, {t('paymentStatus')}
          </p>
        </div>
      </div>

      {error ? <div className="panel border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div> : null}

      {/* Invoices List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size={32} />
        </div>
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={t('noData') || 'No invoices generated yet'}
          description="Invoices will be recorded when completing sales or billing client enterprise orders."
        />
      ) : (
        <div className="panel border-line overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-ink-950 border-b border-line text-slate-400 uppercase text-[11px] font-semibold">
                <tr>
                  <th className="py-3 px-4">{t('invoiceNumber') || 'Invoice Number'}</th>
                  <th className="py-3 px-4">{t('customer')}</th>
                  <th className="py-3 px-4">{t('date')}</th>
                  <th className="py-3 px-4 font-mono">{t('total')}</th>
                  <th className="py-3 px-4 text-center">{t('status')}</th>
                  <th className="py-3 px-4 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-slate-200">
                {invoices.map((inv) => {
                  const isPaid = inv.status === 'paid';
                  const invNum = inv.invoice_number || inv.invoiceNumber || `INV-${String(inv.id).padStart(6, '0')}`;

                  return (
                    <tr key={inv.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3 px-4 font-mono font-medium text-white">
                        <button
                          type="button"
                          onClick={() => handleView(inv.id)}
                          className="hover:text-brand-blue flex items-center gap-1.5"
                        >
                          <FileText size={14} className="text-slate-400" />
                          {invNum}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-slate-300">
                        {inv.customer_name || inv.customerName || t('walkInCustomer') || 'Walk-in Customer'}
                      </td>

                      <td className="py-3 px-4 text-xs text-slate-400">
                        {(inv.created_at || inv.createdAt) ? new Date(inv.created_at || inv.createdAt).toLocaleDateString(document.documentElement.lang || undefined) : '—'}
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold text-emerald-400">
                        {formatMoney(inv.total_amount ?? inv.total, currency)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                            isPaid
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {isPaid ? t('paid') : t('unpaid')}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View details */}
                          <button
                            type="button"
                            onClick={() => handleView(inv.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                            title={t('viewDetails') || 'View Invoice'}
                          >
                            <Eye size={16} />
                          </button>

                          {/* Mark Paid */}
                          {!isPaid ? (
                            <button
                              type="button"
                              onClick={() => handleMarkPaid(inv.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-white/10"
                              title={t('markAsPaid') || 'Mark as Paid'}
                            >
                              <CheckCircle size={16} />
                            </button>
                          ) : null}
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

      {/* DETAILED INVOICE VIEW MODAL */}
      {viewInvoice || loadingDetails ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="invoice-print-area relative w-full max-w-2xl rounded-2xl border border-line bg-ink-900 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-line pb-4 mb-4">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Modiri" className="h-8 w-8 rounded-lg object-contain" />
                <div>
                  <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                    {t('invoiceDetails') || 'Invoice Details'}
                    <span className="text-xs font-mono text-brand-blue">
                      {viewInvoice?.invoice_number || viewInvoice?.invoiceNumber || ''}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {company?.name || 'Modiri Business'} · {(viewInvoice?.created_at || viewInvoice?.createdAt) ? new Date(viewInvoice.created_at || viewInvoice.createdAt).toLocaleString(document.documentElement.lang || undefined) : ''}
                  </p>
                </div>
              </div>
              <button onClick={() => setViewInvoice(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {loadingDetails ? (
              <div className="flex justify-center py-16"><Spinner size={28} /></div>
            ) : viewInvoice ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-xs bg-white/5 p-4 rounded-xl border border-line">
                  <div>
                    <p className="text-slate-400 uppercase font-semibold">{t('billedTo') || 'Billed To'}:</p>
                    <p className="text-white font-bold text-sm mt-0.5">
                      {viewInvoice.customer_name || viewInvoice.customerName || t('walkInCustomer') || 'Walk-in Customer'}
                    </p>
                    <p className="text-slate-400">{viewInvoice.customer_phone || ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 uppercase font-semibold">{t('paymentStatus') || 'Payment Status'}:</p>
                    <p className={`font-bold uppercase mt-0.5 ${viewInvoice.status === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {viewInvoice.status === 'paid' ? t('paid') : t('unpaid')}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    {t('itemCount') || 'Invoice Items'}
                  </h4>
                  <div className="border border-line rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-ink-950 border-b border-line text-slate-400 uppercase">
                        <tr>
                          <th className="py-2.5 px-3">{t('productsAndStock') || 'Item'}</th>
                          <th className="py-2.5 px-3 text-center">{t('quantity') || 'Qty'}</th>
                          <th className="py-2.5 px-3 font-mono">{t('price') || 'Price'}</th>
                          <th className="py-2.5 px-3 text-right font-mono">{t('total') || 'Total'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line text-slate-300">
                        {(viewInvoice.items || []).map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-2.5 px-3 font-medium text-white">{item.product_name || item.name}</td>
                            <td className="py-2.5 px-3 text-center">{item.quantity}</td>
                            <td className="py-2.5 px-3 font-mono">{formatMoney(item.unit_price ?? item.unitPrice, currency)}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-white">
                              {formatMoney(item.total_amount ?? item.line_total ?? item.total ?? ((item.quantity || 1) * (item.unit_price ?? item.unitPrice ?? 0)), currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-line pt-4">
                  <span className="text-sm font-semibold text-slate-300">{t('total') || 'Grand Total'}:</span>
                  <span className="text-xl font-bold font-mono text-emerald-400">
                    {formatMoney(viewInvoice.total_amount ?? viewInvoice.total, currency)}
                  </span>
                </div>

                <div className="invoice-print-actions flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="btn-ghost py-2 px-3 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Printer size={14} /> {t('printReceipt') || 'Print / Save as PDF'}
                  </button>

                  {viewInvoice.status !== 'paid' ? (
                    <button
                      type="button"
                      onClick={() => handleMarkPaid(viewInvoice.id)}
                      className="btn-ghost py-2 px-4 text-xs font-semibold text-emerald-400"
                    >
                      {t('markAsPaid') || 'Mark as Paid'}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
