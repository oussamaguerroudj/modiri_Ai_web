import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart,
  Plus,
  UtensilsCrossed,
  Clock,
  CheckCircle,
  Eye,
  DollarSign,
  Download,
  X,
  Check,
  AlertCircle,
  Printer,
  FileText,
} from 'lucide-react';
import {
  getOrders,
  getActiveOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  recordOrderPayment,
  refundOrder,
  getTables,
  getMenuItems,
} from '../../api/restaurant';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { formatMoney } from '../../utils/currency.js';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Alert from '../../components/ui/Alert.jsx';

export default function RestaurantOrdersPage() {
  const { company } = useAuth();
  const { t } = useLanguage();
  const currency = company?.currency || 'DZD';

  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'all'
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New Order Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState('');
  const [orderItems, setOrderItems] = useState([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Detail Modal
  const [viewOrderId, setViewOrderId] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Payment Modal
  const [payOrder, setPayOrder] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersData, tablesData, menuData] = await Promise.all([
        activeTab === 'active' ? getActiveOrders() : getOrders(),
        getTables(),
        getMenuItems(),
      ]);
      setOrders(ordersData);
      setTables(tablesData);
      setMenuItems(menuData);
    } catch (err) {
      setError(err.message || 'Failed to load restaurant orders');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function getTableLabel(ord) {
    if (!ord) return t('takeaway');
    const tableId = ord.table_id || ord.tableId;
    if (!tableId) return ord.table_name || ord.tableName || t('takeaway');

    const foundTable = tables.find((t) => t.id === tableId);
    if (foundTable) {
      return foundTable.name || `Table ${foundTable.table_number || foundTable.number || ''}`;
    }
    if (ord.table_name || ord.tableName) return ord.table_name || ord.tableName;
    return `${t('table')} #${String(tableId).slice(0, 4)}`;
  }

  function openCreateOrder() {
    setSelectedTableId(tables[0]?.id || '');
    setOrderItems([]);
    setOrderNotes('');
    setModalOpen(true);
  }

  function addItemToOrder(item) {
    const existing = orderItems.find((i) => i.menuItemId === item.id);
    if (existing) {
      setOrderItems(
        orderItems.map((i) =>
          i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setOrderItems([
        ...orderItems,
        {
          menuItemId: item.id,
          name: item.name,
          unitPrice: Number(item.price) || 0,
          quantity: 1,
        },
      ]);
    }
  }

  function removeOrderItem(menuItemId) {
    setOrderItems(orderItems.filter((i) => i.menuItemId !== menuItemId));
  }

  async function handleCreateOrder(e) {
    e.preventDefault();
    if (orderItems.length === 0) {
      alert(t('pleaseMatchAllItems') || 'Add at least one menu item to the order.');
      return;
    }
    setSubmitting(true);
    try {
      await createOrder({
        tableId: selectedTableId || undefined,
        notes: orderNotes.trim() || undefined,
        items: orderItems.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      });
      setModalOpen(false);
      loadData();
    } catch (err) {
      alert(`Failed to place order: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(orderId, status) {
    try {
      await updateOrderStatus(orderId, status);
      loadData();
      if (orderDetails && orderDetails.id === orderId) {
        setOrderDetails({ ...orderDetails, status });
      }
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
  }

  async function openDetails(orderId) {
    setViewOrderId(orderId);
    setLoadingDetails(true);
    try {
      const data = await getOrderById(orderId);
      setOrderDetails(data);
    } catch (err) {
      alert(`Could not load order details: ${err.message}`);
    } finally {
      setLoadingDetails(false);
    }
  }

  async function handlePayment(e) {
    e.preventDefault();
    if (!payOrder || !payAmount) return;
    try {
      await recordOrderPayment(payOrder.id, {
        amount: Number(payAmount),
        method: payMethod,
      });
      setPayOrder(null);
      loadData();
      if (orderDetails && orderDetails.id === payOrder.id) {
        setOrderDetails({ ...orderDetails, status: 'served', payment_status: 'paid' });
      }
    } catch (err) {
      alert(`Payment failed: ${err.message}`);
    }
  }

  function handlePrintReceipt() {
    window.print();
  }

  const orderTotal = orderItems.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <ShoppingCart className="text-brand-blue" />
            {t('ordersTitle') || 'Restaurant Orders & Kitchen'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t('navDashboard')}: {activeTab === 'active' ? t('activeKitchen') : t('orderHistory')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Tab Filter */}
          <div className="flex p-1 rounded-xl bg-ink-900 border border-line">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'active' ? 'bg-brand-blue text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('activeKitchen') || 'Active Kitchen'}
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'all' ? 'bg-brand-blue text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('orderHistory') || 'All History'}
            </button>
          </div>

          <button
            type="button"
            onClick={openCreateOrder}
            className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-brand-blue/20"
          >
            <Plus size={16} /> {t('newOrder') || 'New Order'}
          </button>
        </div>
      </div>

      {error ? <div className="panel border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div> : null}

      {/* Orders Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={32} /></div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title={activeTab === 'active' ? (t('noActiveOrdersMessage') || 'No active kitchen tickets') : (t('noOrdersYet') || 'No orders recorded yet')}
          description="Take orders at tables or for take-away dining."
          action={
            <button onClick={openCreateOrder} className="btn-primary mt-4 py-2 px-4 text-xs font-semibold">
              <Plus size={16} className="mr-1 inline" /> {t('newOrder') || 'Create First Order'}
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((ord) => {
            const tableLabel = getTableLabel(ord);
            const status = ord.status || 'pending';

            return (
              <div
                key={ord.id}
                className="panel p-5 border-line flex flex-col justify-between hover:border-slate-600 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-white text-base flex items-center gap-1.5">
                      <UtensilsCrossed size={16} className="text-brand-blue" />
                      {tableLabel}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                        status === 'served'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : status === 'ready'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : status === 'preparing'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                          : 'bg-white/10 text-slate-300 border border-line'
                      }`}
                    >
                      {t(status) || status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 font-mono mb-4">
                    #{String(ord.id).slice(0, 8)} · {new Date(ord.created_at).toLocaleTimeString()}
                  </p>

                  <div className="space-y-1.5 border-t border-b border-line py-3 mb-4 text-xs">
                    {(ord.items || []).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-slate-300">
                        <span>{item.quantity}x {item.name || item.menu_item_name}</span>
                        <span className="font-mono">{formatMoney((item.quantity || 1) * (item.unit_price || 0), currency)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 font-medium">{t('billTotal') || 'Total Bill'}:</span>
                    <span className="text-base font-bold font-mono text-emerald-400">
                      {formatMoney(ord.total_amount ?? ord.total ?? 0, currency)}
                    </span>
                  </div>

                  {/* Payment Status Indicator */}
                  <div className="flex items-center justify-between mb-3 text-[11px]">
                    <span className="text-slate-400">{t('paymentStatus') || 'Payment'}:</span>
                    {Number(ord.amount_paid || 0) >= Number(ord.total_amount || 0) && Number(ord.total_amount || 0) > 0 ? (
                      <span className="px-2 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {t('paid') || 'Paid'}
                      </span>
                    ) : Number(ord.amount_paid || 0) > 0 ? (
                      <span className="px-2 py-0.5 rounded-full font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {t('partiallyPaid') || 'Partial'}: {formatMoney(ord.amount_paid, currency)}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full font-semibold bg-red-500/20 text-red-300 border border-red-500/30">
                        {t('unpaid') || 'Unpaid'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status Advance Button */}
                    {status === 'pending' ? (
                      <button
                        onClick={() => handleStatusChange(ord.id, 'preparing')}
                        className="btn-primary py-1.5 px-3 text-xs flex-1 font-semibold"
                      >
                        {t('startPrep') || 'Start Prep'}
                      </button>
                    ) : status === 'preparing' ? (
                      <button
                        onClick={() => handleStatusChange(ord.id, 'ready')}
                        className="btn-primary py-1.5 px-3 text-xs flex-1 font-semibold bg-blue-600 hover:bg-blue-500"
                      >
                        {t('markReady') || 'Mark Ready'}
                      </button>
                    ) : status === 'ready' ? (
                      <button
                        onClick={() => handleStatusChange(ord.id, 'served')}
                        className="btn-primary py-1.5 px-3 text-xs flex-1 font-semibold bg-emerald-600 hover:bg-emerald-500"
                      >
                        {t('served') || 'Mark Served'}
                      </button>
                    ) : status === 'served' ? (
                      <button
                        onClick={() => handleStatusChange(ord.id, 'completed')}
                        className="btn-primary py-1.5 px-3 text-xs flex-1 font-semibold bg-indigo-600 hover:bg-indigo-500"
                      >
                        {t('complete') || 'Complete'}
                      </button>
                    ) : null}

                    {/* Pay Button */}
                    {Number(ord.amount_paid || 0) < Number(ord.total_amount || 0) ? (
                      <button
                        type="button"
                        onClick={() => {
                          setPayOrder(ord);
                          const remaining = Math.max(0, Number(ord.total_amount ?? ord.total ?? 0) - Number(ord.amount_paid || 0));
                          setPayAmount(remaining.toString());
                        }}
                        className="btn-ghost py-1.5 px-3 text-xs font-semibold text-emerald-400 flex items-center gap-1 hover:bg-emerald-500/10"
                      >
                        <DollarSign size={14} /> {t('cash') || 'Pay'}
                      </button>
                    ) : null}

                    {/* Detailed Page / Modal */}
                    <button
                      type="button"
                      onClick={() => openDetails(ord.id)}
                      className="btn-ghost py-1.5 px-2.5 text-xs text-slate-300 hover:text-white"
                      title={t('viewDetails') || 'View Details'}
                    >
                      <Eye size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Order Modal */}
      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl rounded-2xl border border-line bg-ink-900 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UtensilsCrossed size={18} className="text-brand-blue" />
                {t('newOrder') || 'New Kitchen Ticket'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Menu items picker */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  {t('menuTitle') || 'Select Dishes'}
                </h4>
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {menuItems.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => addItemToOrder(m)}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-line bg-white/5 hover:border-brand-blue transition cursor-pointer text-xs"
                    >
                      <div>
                        <p className="font-semibold text-white">{m.name}</p>
                        <p className="text-[11px] text-slate-400">{m.category || 'Kitchen'}</p>
                      </div>
                      <span className="font-mono font-bold text-slate-200">
                        {formatMoney(m.price, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Cart */}
              <div className="flex flex-col justify-between border-t md:border-t-0 md:border-l border-line md:pl-6 pt-4 md:pt-0">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      {t('table') || 'Select Table'}
                    </label>
                    <select
                      value={selectedTableId}
                      onChange={(e) => setSelectedTableId(e.target.value)}
                      className="input-field py-1.5 text-xs"
                    >
                      <option value="">{t('takeaway') || 'Takeaway / Bar'}</option>
                      {tables.map((tItem) => (
                        <option key={tItem.id} value={tItem.id} className="bg-ink-900 text-white">
                          {tItem.name || `Table ${tItem.table_number || tItem.number}`} ({tItem.seats || 2} {t('seats')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    {t('itemCount') || 'Order Items'}
                  </h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                    {orderItems.length === 0 ? (
                      <p className="text-xs text-slate-500 py-2">{t('clickDishesToAdd')}</p>
                    ) : (
                      orderItems.map((i) => (
                        <div key={i.menuItemId} className="flex items-center justify-between p-2 rounded-lg bg-white/5 text-xs">
                          <span className="truncate">{i.quantity}x {i.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold">{formatMoney(i.quantity * i.unitPrice, currency)}</span>
                            <button
                              type="button"
                              onClick={() => removeOrderItem(i.menuItemId)}
                              className="text-slate-400 hover:text-red-400"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      {t('description') || 'Notes'}
                    </label>
                    <input
                      type="text"
                      placeholder={t('exampleOrderNotes')}
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      className="input-field py-1.5 text-xs"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-line mt-4">
                  <div className="flex items-center justify-between mb-3 text-sm">
                    <span className="font-medium text-slate-300">{t('total')}:</span>
                    <span className="font-bold font-mono text-emerald-400 text-base">{formatMoney(orderTotal, currency)}</span>
                  </div>

                  <button
                    type="button"
                    disabled={submitting || orderItems.length === 0}
                    onClick={handleCreateOrder}
                    className="btn-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    {submitting ? <Spinner size={16} /> : <Check size={16} />}
                    {t('confirm') || 'Submit Kitchen Ticket'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* DETAILED ORDER PAGE / MODAL */}
      {viewOrderId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-2xl border border-line bg-ink-900 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-line pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-brand-blue/20 flex items-center justify-center text-brand-blue border border-brand-blue/30">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {t('orderDetails') || 'Order Details'}
                    <span className="text-xs font-mono text-slate-400">#{String(viewOrderId).slice(0, 8)}</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {company?.name} · {orderDetails?.created_at ? new Date(orderDetails.created_at).toLocaleString(document.documentElement.lang || undefined) : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setViewOrderId(null);
                  setOrderDetails(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {loadingDetails ? (
              <div className="flex justify-center py-12"><Spinner size={28} /></div>
            ) : orderDetails ? (
              <div className="space-y-5 text-xs">
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-white/5 border border-line">
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] font-semibold">{t('table') || 'Location'}:</span>
                    <p className="text-white font-bold text-sm mt-0.5">{getTableLabel(orderDetails)}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] font-semibold">{t('status')}:</span>
                    <p className="font-bold text-sm capitalize text-brand-blue mt-0.5">
                      {t(orderDetails.status) || orderDetails.status}
                    </p>
                  </div>
                </div>

                {orderDetails.notes && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
                    <span className="font-semibold">{t('description') || 'Kitchen Note'}: </span>
                    {orderDetails.notes}
                  </div>
                )}

                {/* Items Table */}
                <div>
                  <h4 className="font-bold text-slate-300 uppercase tracking-wider mb-2">{t('itemCount') || 'Items Ordered'}</h4>
                  <div className="rounded-xl border border-line overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-ink-950 border-b border-line text-slate-400 uppercase text-[10px]">
                        <tr>
                          <th className="py-2 px-3">{t('dishName') || 'Dish'}</th>
                          <th className="py-2 px-3 text-center">{t('quantity') || 'Qty'}</th>
                          <th className="py-2 px-3 font-mono">{t('unitPrice') || 'Price'}</th>
                          <th className="py-2 px-3 text-right font-mono">{t('total') || 'Total'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line text-slate-300">
                        {(orderDetails.items || []).map((it, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 font-medium text-white">{it.name || it.menu_item_name}</td>
                            <td className="py-2 px-3 text-center">{it.quantity}</td>
                            <td className="py-2 px-3 font-mono">{formatMoney(it.unit_price, currency)}</td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-white">
                              {formatMoney(it.quantity * it.unit_price, currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Total & Payment Summary */}
                <div className="border-t border-line pt-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-300">{t('billTotal') || 'Grand Total'}:</span>
                    <span className="text-xl font-bold font-mono text-emerald-400">
                      {formatMoney(orderDetails.total_amount ?? orderDetails.total ?? 0, currency)}
                    </span>
                  </div>
                  {Number(orderDetails.amount_paid || 0) > 0 && (
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{t('amountPaid') || 'Paid'}:</span>
                      <span className="font-mono text-slate-200">{formatMoney(orderDetails.amount_paid, currency)}</span>
                    </div>
                  )}
                  {Number(orderDetails.amount_paid || 0) < Number(orderDetails.total_amount ?? orderDetails.total ?? 0) && (
                    <div className="flex items-center justify-between text-xs font-semibold text-amber-400">
                      <span>{t('balanceDue') || 'Remaining Due'}:</span>
                      <span className="font-mono">
                        {formatMoney(
                          Math.max(0, Number(orderDetails.total_amount ?? orderDetails.total ?? 0) - Number(orderDetails.amount_paid || 0)),
                          currency
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                  <button
                    type="button"
                    onClick={handlePrintReceipt}
                    className="btn-ghost py-2 px-3 text-xs flex items-center gap-1.5"
                  >
                    <Printer size={14} /> {t('printReceipt') || 'Print Ticket'}
                  </button>

                  {Number(orderDetails.amount_paid || 0) < Number(orderDetails.total_amount ?? orderDetails.total ?? 0) ? (
                    <button
                      type="button"
                      onClick={() => {
                        setPayOrder(orderDetails);
                        const remaining = Math.max(0, Number(orderDetails.total_amount ?? orderDetails.total ?? 0) - Number(orderDetails.amount_paid || 0));
                        setPayAmount(remaining.toString());
                      }}
                      className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <DollarSign size={14} /> {t('serveAndPay') || 'Settle Bill'}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Pay Order Modal */}
      {payOrder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl border border-line bg-ink-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <DollarSign className="text-emerald-400" size={18} />
              {t('serveAndPay') || 'Settle Order Bill'}
            </h3>

            {/* Quick Bill Breakdown in modal */}
            <div className="p-3 mb-4 rounded-xl bg-ink-950 border border-line text-xs space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>{t('billTotal') || 'Order Total'}:</span>
                <span className="font-mono text-white font-semibold">
                  {formatMoney(payOrder.total_amount ?? payOrder.total ?? 0, currency)}
                </span>
              </div>
              {Number(payOrder.amount_paid || 0) > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>{t('amountPaid') || 'Already Paid'}:</span>
                  <span className="font-mono text-slate-300">{formatMoney(payOrder.amount_paid, currency)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold pt-1 border-t border-line text-emerald-400">
                <span>{t('balanceDue') || 'Remaining Due'}:</span>
                <span className="font-mono">
                  {formatMoney(
                    Math.max(0, Number(payOrder.total_amount ?? payOrder.total ?? 0) - Number(payOrder.amount_paid || 0)),
                    currency
                  )}
                </span>
              </div>
            </div>

            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">{t('amount')} ({currency})</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="input-field py-2 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">{t('paymentMethod')}</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="input-field py-2 text-sm"
                >
                  <option value="cash">{t('cash') || 'Cash'}</option>
                  <option value="card">{t('card') || 'Card'}</option>
                  <option value="credit">{t('credit') || 'Credit'}</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-line">
                <button type="button" onClick={() => setPayOrder(null)} className="btn-ghost py-1.5 px-3 text-xs">
                  {t('cancel')}
                </button>
                <button type="submit" className="btn-primary py-1.5 px-4 text-xs font-semibold">
                  {t('confirm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
