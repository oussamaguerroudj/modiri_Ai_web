import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  User,
  CreditCard,
  Banknote,
  Receipt,
  Trash2,
  X,
  Check,
  Package,
  Calendar,
  Eye,
  Printer,
  FileText,
} from 'lucide-react';
import { getSales, createSale } from '../../api/sales';
import { getProducts } from '../../api/products';
import { getCustomers } from '../../api/customers';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { formatMoney } from '../../utils/currency.js';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Alert from '../../components/ui/Alert.jsx';

export default function SalesPage() {
  const { company } = useAuth();
  const { t } = useLanguage();
  const currency = company?.currency || 'DZD';

  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Cart / POS State
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'card' | 'credit'
  const [productSearch, setProductSearch] = useState('');

  // Detailed Sale View
  const [viewSale, setViewSale] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [salesData, productsData, customersData] = await Promise.all([
        getSales(),
        getProducts(),
        getCustomers(),
      ]);
      setSales(salesData);
      setProducts(productsData);
      setCustomers(customersData);
    } catch (err) {
      setError(err.message || 'Failed to load sales data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openCreateModal() {
    setCart([]);
    setSelectedCustomer('');
    setPaymentMethod('cash');
    setProductSearch('');
    setError('');
    setModalOpen(true);
  }

  function addToCart(product) {
    const existing = cart.find((i) => i.product.id === product.id);
    if (existing) {
      setCart(
        cart.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      );
    } else {
      setCart([
        ...cart,
        {
          product,
          quantity: 1,
          unitPrice: Number(product.selling_price) || 0,
        },
      ]);
    }
  }

  function updateQuantity(productId, nextQty) {
    if (nextQty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(
      cart.map((i) =>
        i.product.id === productId ? { ...i, quantity: nextQty } : i
      )
    );
  }

  function removeFromCart(productId) {
    setCart(cart.filter((i) => i.product.id !== productId));
  }

  const grandTotal = cart.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  async function handleCheckout(e) {
    e.preventDefault();
    if (cart.length === 0) {
      setError(t('pleaseMatchAllItems') || 'Please add at least one product to the sale.');
      return;
    }
    if (paymentMethod === 'credit' && !selectedCustomer) {
      setError(t('selectCustomerFirst') || 'Customer selection is required for Credit sales.');
      return;
    }

    setSubmitting(true);
    setError('');

    const payload = {
      customerId: selectedCustomer || undefined,
      paymentMethod,
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    };

    try {
      await createSale(payload);
      setModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to process sale');
    } finally {
      setSubmitting(false);
    }
  }

  const filteredCatalog = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(productSearch.toLowerCase())) ||
      (p.barcode && p.barcode.includes(productSearch))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <ShoppingCart className="text-brand-blue" />
            {t('salesAndPos') || 'Sales & POS Terminal'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t('navDashboard')}: {t('newSale')}, {t('cash')}, {t('card')}, {t('credit')}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="btn-primary self-start sm:self-auto py-2.5 px-4 text-sm font-semibold flex items-center gap-2 shadow-lg shadow-brand-blue/20"
        >
          <Plus size={18} />
          {t('newSale') || 'New Sale'}
        </button>
      </div>

      {/* Sales Transactions List */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={32} /></div>
      ) : sales.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title={t('noSalesInPeriod') || 'No sales recorded yet'}
          description="Click New Sale above to start selling products."
          action={
            <button onClick={openCreateModal} className="btn-primary mt-4 py-2 px-4 text-xs font-semibold">
              <Plus size={16} className="mr-1 inline" /> {t('newSale') || 'Record First Sale'}
            </button>
          }
        />
      ) : (
        <div className="panel overflow-hidden border-line">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-ink-950 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">{t('salesId') || 'Sale ID'}</th>
                  <th className="py-3.5 px-4">{t('customer')}</th>
                  <th className="py-3.5 px-4">{t('itemCount')}</th>
                  <th className="py-3.5 px-4">{t('paymentMethod')}</th>
                  <th className="py-3.5 px-4">{t('date')}</th>
                  <th className="py-3.5 px-4 font-mono">{t('total')}</th>
                  <th className="py-3.5 px-4 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-slate-300 text-xs sm:text-sm">
                {sales.map((sale) => {
                  const itemCount = sale.items?.length ?? sale.item_count ?? 1;
                  const pm = (sale.payment_method || sale.paymentMethod || 'cash').toLowerCase();
                  return (
                    <tr key={sale.id} className="hover:bg-white/5 transition">
                      <td className="py-3 px-4 font-mono font-medium text-white text-xs">
                        #{String(sale.id).slice(0, 8)}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <span className="flex items-center gap-1.5 text-slate-200">
                          <User size={13} className="text-slate-400" />
                          {sale.customer_name || sale.customerName || t('walkInCustomer') || 'Walk-in Customer'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-300 font-medium">
                        {itemCount} {t('itemCount')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-brand-blue/15 text-blue-300 border border-brand-blue/30">
                          {t(pm) || pm}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400">
                        {(sale.created_at || sale.createdAt) ? new Date(sale.created_at || sale.createdAt).toLocaleString(document.documentElement.lang || undefined) : 'Recent'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400 text-sm">
                        {formatMoney(sale.total_amount ?? sale.totalAmount ?? sale.total, currency)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setViewSale(sale)}
                          className="btn-ghost py-1 px-2.5 text-xs text-slate-300 hover:text-white inline-flex items-center gap-1"
                        >
                          <Eye size={14} /> {t('details')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAILED SALE VIEW MODAL */}
      {viewSale ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-line bg-ink-900 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <Receipt className="text-brand-blue" size={20} />
                <div>
                  <h3 className="text-base font-bold text-white">
                    {t('details')}: #{String(viewSale.id).slice(0, 8)}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {viewSale.created_at ? new Date(viewSale.created_at).toLocaleString(document.documentElement.lang || undefined) : ''}
                  </p>
                </div>
              </div>
              <button onClick={() => setViewSale(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-white/5 border border-line">
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-semibold">{t('customer')}:</span>
                  <p className="font-semibold text-white mt-0.5">
                    {viewSale.customer_name || viewSale.customerName || t('walkInCustomer')}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-semibold">{t('paymentMethod')}:</span>
                  <p className="font-semibold text-emerald-400 uppercase mt-0.5">
                    {t(viewSale.payment_method || viewSale.paymentMethod || 'cash')}
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 className="font-bold text-slate-300 uppercase tracking-wider mb-2">{t('itemCount')}</h4>
                <div className="rounded-xl border border-line overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-ink-950 border-b border-line text-slate-400 uppercase text-[10px]">
                      <tr>
                        <th className="py-2 px-3">{t('productsAndStock')}</th>
                        <th className="py-2 px-3 text-center">{t('quantity')}</th>
                        <th className="py-2 px-3 font-mono">{t('unitPrice')}</th>
                        <th className="py-2 px-3 text-right font-mono">{t('total')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line text-slate-300">
                      {(viewSale.items || []).map((it, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-medium text-white">{it.product_name || it.name}</td>
                          <td className="py-2 px-3 text-center">{it.quantity}</td>
                          <td className="py-2 px-3 font-mono">{formatMoney(it.unit_price, currency)}</td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-white">
                            {formatMoney((it.quantity || 1) * (it.unit_price || 0), currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between border-t border-line pt-3">
                <span className="text-sm font-semibold text-slate-300">{t('total')}:</span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  {formatMoney(viewSale.total_amount ?? viewSale.totalAmount ?? viewSale.total, currency)}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-ghost py-2 px-3 text-xs flex items-center gap-1.5"
                >
                  <Printer size={14} /> {t('printReceipt')}
                </button>
                <button
                  type="button"
                  onClick={() => setViewSale(null)}
                  className="btn-primary py-2 px-4 text-xs font-semibold"
                >
                  {t('close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* POS New Sale Modal / Drawer */}
      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-4xl rounded-2xl border border-line bg-ink-900 shadow-2xl overflow-hidden my-4">
            <div className="flex items-center justify-between border-b border-line px-6 py-4 bg-ink-900/80">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShoppingCart size={20} className="text-brand-blue" />
                {t('newSale') || 'New POS Sale'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <Alert>{error}</Alert>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Left: Product Picker */}
                <div className="md:col-span-7 space-y-4">
                  <div className="relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder={t('searchPlaceholder') || 'Search items by name, barcode...'}
                      className="input-field pl-10 py-2 text-xs"
                    />
                  </div>

                  <div className="h-96 overflow-y-auto pr-1 space-y-2">
                    {filteredCatalog.map((prod) => {
                      const qty = Number(prod.quantity) || 0;
                      const inCart = cart.some((i) => i.product.id === prod.id);

                      return (
                        <div
                          key={prod.id}
                          onClick={() => addToCart(prod)}
                          className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                            inCart
                              ? 'border-brand-blue/50 bg-brand-blue/10'
                              : 'border-line bg-white/5 hover:border-slate-500'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-ink-950 flex items-center justify-center border border-line text-slate-400 shrink-0">
                              <Package size={16} />
                            </div>
                            <div>
                              <p className="font-semibold text-white text-xs">{prod.name}</p>
                              <p className="text-[11px] text-slate-400">
                                {t('stock')}: {qty} · {prod.category || 'General'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-mono font-bold text-sm text-emerald-400">
                              {formatMoney(prod.selling_price, currency)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Cart & Payment Checkout */}
                <div className="md:col-span-5 flex flex-col justify-between border-t md:border-t-0 md:border-l border-line md:pl-6 pt-4 md:pt-0">
                  <div className="space-y-4">
                    {/* Customer Picker */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                        {t('customer')}
                      </label>
                      <select
                        value={selectedCustomer}
                        onChange={(e) => setSelectedCustomer(e.target.value)}
                        className="input-field py-1.5 text-xs"
                      >
                        <option value="">{t('walkInCustomer') || 'Walk-in Customer'}</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id} className="bg-ink-900 text-white">
                            {c.name} {c.phone ? `(${c.phone})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Cart Items */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        {t('itemCount')} ({cart.length})
                      </h4>
                      <div className="h-44 overflow-y-auto pr-1 space-y-1.5">
                        {cart.length === 0 ? (
                          <div className="text-center py-8 text-xs text-slate-500">
                            {t('noData')} {t('clickProductsToAdd')}
                          </div>
                        ) : (
                          cart.map((item) => (
                            <div
                              key={item.product.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-line text-xs"
                            >
                              <div className="truncate flex-1 mr-2">
                                <p className="font-medium text-white truncate">{item.product.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono">
                                  {formatMoney(item.unitPrice, currency)}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                  className="h-6 w-6 rounded bg-ink-950 border border-line text-white flex items-center justify-center font-bold"
                                >
                                  -
                                </button>
                                <span className="font-mono px-1 font-semibold text-white">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                  className="h-6 w-6 rounded bg-ink-950 border border-line text-white flex items-center justify-center font-bold"
                                >
                                  +
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeFromCart(item.product.id)}
                                  className="text-slate-400 hover:text-red-400 ml-1"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Payment Method Selector */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                        {t('paymentMethod')}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('cash')}
                          className={`p-2 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${
                            paymentMethod === 'cash'
                              ? 'border-brand-blue bg-brand-blue/15 text-white shadow-sm'
                              : 'border-line bg-white/5 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Banknote size={16} />
                          {t('cash')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('card')}
                          className={`p-2 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${
                            paymentMethod === 'card'
                              ? 'border-brand-blue bg-brand-blue/15 text-white shadow-sm'
                              : 'border-line bg-white/5 text-slate-400 hover:text-white'
                          }`}
                        >
                          <CreditCard size={16} />
                          {t('card')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('credit')}
                          className={`p-2 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${
                            paymentMethod === 'credit'
                              ? 'border-brand-amber bg-amber-500/15 text-amber-300 shadow-sm'
                              : 'border-line bg-white/5 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Receipt size={16} />
                          {t('credit')}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Checkout Footer */}
                  <div className="pt-4 border-t border-line mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs uppercase font-semibold text-slate-400">{t('total')}:</span>
                      <span className="text-lg font-bold font-mono text-emerald-400">
                        {formatMoney(grandTotal, currency)}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={submitting || cart.length === 0}
                      onClick={handleCheckout}
                      className="btn-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
                    >
                      {submitting ? <Spinner size={16} /> : <Check size={16} />}
                      {t('confirm') || 'Complete Transaction'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
