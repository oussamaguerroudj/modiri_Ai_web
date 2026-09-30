import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Wallet,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  X,
  Check,
  Tag,
  DollarSign,
  TrendingDown,
  Eye,
  FileText,
  Briefcase,
  Users,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../../api/expenses';
import { getEmployees } from '../../api/employees';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { formatMoney } from '../../utils/currency.js';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Alert from '../../components/ui/Alert.jsx';
import StatCard from '../../components/ui/StatCard.jsx';

const EXPENSE_CATEGORIES = [
  'Rent',
  'Utilities (Electricity, Water, Gas)',
  'Salaries & Wages',
  'Inventory & Supplies',
  'Maintenance & Repairs',
  'Marketing & Advertising',
  'Transport & Logistics',
  'Insurance',
  'Software & Subscriptions',
  'Taxes & Government Fees',
  'Other',
];

export default function ExpensesPage() {
  const { company } = useAuth();
  const { t } = useLanguage();
  const currency = company?.currency || 'DZD';

  const [expenses, setExpenses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [serverMonthlyTotal, setServerMonthlyTotal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Detailed Expense Modal
  const [viewExpense, setViewExpense] = useState(null);

  // Duplicate Salary Warning Dialog
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  const currentMonthStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    period: 'one_time',
    periodEnd: '',
    employeeId: '',
    salaryPeriod: currentMonthStr,
    duration: '1 month',
  });

  const isSalary = useMemo(() => {
    const cat = formData.category.toLowerCase();
    return (
      cat.includes('salar') ||
      cat.includes('paie') ||
      cat.includes('wage') ||
      cat.includes('payroll') ||
      Boolean(formData.employeeId)
    );
  }, [formData.category, formData.employeeId]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [expResponse, empList] = await Promise.all([
        getExpenses(),
        getEmployees().catch(() => []),
      ]);
      const rows = Array.isArray(expResponse) ? expResponse : expResponse?.expenses || [];
      setExpenses(rows);
      setEmployees(empList || []);
      const monthTotal = expResponse?.thisMonthTotal;
      setServerMonthlyTotal(
        monthTotal == null || !Number.isFinite(Number(monthTotal))
          ? null
          : Number(monthTotal)
      );
    } catch (err) {
      setError(err.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openCreateModal() {
    setEditingExpense(null);
    setFormData({
      category: '',
      description: '',
      amount: '',
      expenseDate: new Date().toISOString().split('T')[0],
      period: 'one_time',
      periodEnd: '',
      employeeId: '',
      salaryPeriod: currentMonthStr,
      duration: '1 month',
    });
    setError('');
    setModalOpen(true);
  }

  function openEditModal(exp) {
    setEditingExpense(exp);
    setFormData({
      category: exp.category || '',
      description: exp.description || '',
      amount: exp.amount?.toString() || '',
      expenseDate: exp.expense_date
        ? exp.expense_date.split('T')[0]
        : new Date().toISOString().split('T')[0],
      period: exp.period_type || exp.periodType || exp.period || 'one_time',
      periodEnd: exp.period_end ? String(exp.period_end).slice(0, 10) : '',
      employeeId: exp.employee_id || '',
      salaryPeriod: exp.salary_period || currentMonthStr,
      duration: exp.duration || '1 month',
    });
    setError('');
    setModalOpen(true);
  }

  function handleCategoryChange(newCat) {
    const isNewSalary =
      newCat.toLowerCase().includes('salar') ||
      newCat.toLowerCase().includes('paie') ||
      newCat.toLowerCase().includes('wage') ||
      newCat.toLowerCase().includes('payroll');

    setFormData((prev) => ({
      ...prev,
      category: newCat,
      duration: isNewSalary && !prev.duration ? '1 month' : prev.duration,
      salaryPeriod: isNewSalary && !prev.salaryPeriod ? currentMonthStr : prev.salaryPeriod,
    }));
  }

  function handleEmployeeChange(empId) {
    const selectedEmp = employees.find((e) => e.id === empId);
    setFormData((prev) => {
      const updated = { ...prev, employeeId: empId };
      if (selectedEmp) {
        if (!prev.amount || prev.amount === '0') {
          updated.amount = (selectedEmp.baseSalary || selectedEmp.base_salary || '').toString();
        }
        if (!prev.description) {
          updated.description = `${prev.salaryPeriod || currentMonthStr} Salary - ${selectedEmp.name}`;
        }
      }
      return updated;
    });
  }

  async function executeSubmit(payload, isConfirmed = false) {
    setSubmitting(true);
    setError('');

    const finalPayload = {
      ...payload,
      confirmedDuplicate: isConfirmed,
    };

    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, finalPayload);
      } else {
        await createExpense(finalPayload);
      }
      setModalOpen(false);
      setDuplicateWarning(null);
      loadData();
    } catch (err) {
      if (err.status === 409 || err.code === 'DUPLICATE_SALARY_PAYMENT') {
        const emp = employees.find((e) => e.id === payload.employeeId);
        setDuplicateWarning({
          payload,
          employeeName: emp ? emp.name : 'this employee',
          salaryPeriod: payload.salaryPeriod,
          amount: payload.amount,
        });
      } else {
        setError(err.message || 'Operation failed');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.category.trim()) {
      setError('Please enter an expense name or category.');
      return;
    }
    if (isSalary && !formData.employeeId) {
      setError(t('selectEmployee') || 'Please select an employee for this salary payment.');
      return;
    }
    if (
      formData.period === 'custom' &&
      (!formData.periodEnd || formData.periodEnd < formData.expenseDate)
    ) {
      setError('Choose a valid end date for this expense period.');
      return;
    }
    if (
      !formData.amount ||
      !Number.isFinite(Number(formData.amount)) ||
      Number(formData.amount) <= 0
    ) {
      setError('Please provide a valid expense amount.');
      return;
    }

    const payload = {
      category: formData.category.trim(),
      description: formData.description.trim() || undefined,
      amount: Number(formData.amount),
      expenseDate: formData.expenseDate,
      periodType: formData.period,
      periodStart: formData.expenseDate,
      periodEnd: formData.period === 'custom' ? formData.periodEnd : undefined,
      employeeId: isSalary ? formData.employeeId : undefined,
      salaryPeriod: isSalary ? formData.salaryPeriod : undefined,
      duration: isSalary ? formData.duration : undefined,
    };

    await executeSubmit(payload, false);
  }

  async function handleDelete(exp) {
    if (
      !confirm(
        t('confirmDelete') ||
          `Delete this expense of ${formatMoney(exp.amount, currency)}?`
      )
    )
      return;
    try {
      await deleteExpense(exp.id);
      if (viewExpense && viewExpense.id === exp.id) {
        setViewExpense(null);
      }
      loadData();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  }

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const totalExpenses = expenses.reduce(
    (acc, exp) => acc + (Number(exp.amount) || 0),
    0
  );
  const calculatedMonthlyExpenses = expenses.reduce((acc, exp) => {
    const date =
      exp.expense_date || exp.expenseDate || exp.created_at || exp.createdAt;
    return String(date || '').slice(0, 7) === currentMonth
      ? acc + (Number(exp.amount) || 0)
      : acc;
  }, 0);
  const monthlyExpenses = serverMonthlyTotal ?? calculatedMonthlyExpenses;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Wallet className="text-brand-blue" />
            {t('moreExpenses') || 'Expenses'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t('navDashboard')}: {t('amount')}, {t('category')}, {t('date')}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="btn-primary self-start sm:self-auto py-2.5 px-4 text-sm font-semibold flex items-center gap-2 shadow-lg shadow-brand-blue/20"
        >
          <Plus size={18} />
          {t('addExpense') || 'Record Expense'}
        </button>
      </div>

      {error ? (
        <div className="panel border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={TrendingDown}
          tone="amber"
          highlight
          label={`${t('thisMonth')} ${t('moreExpenses') || 'Expenses'}`}
          value={formatMoney(monthlyExpenses, currency)}
          sublabel={currentMonth}
        />
        <StatCard
          icon={Calendar}
          tone="violet"
          label={t('allExpenses')}
          value={formatMoney(totalExpenses, currency)}
          sublabel={`${expenses.length} ${t('transactionList') || 'Transactions'}`}
        />
        <StatCard
          icon={Users}
          tone="teal"
          label={t('moreEmployees')}
          value={employees.length}
          sublabel={t('salaryExpenses')}
        />
      </div>

      {/* Expenses Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size={32} />
        </div>
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title={t('noData') || 'No expenses recorded yet'}
          description="Keep track of your business spending by recording your first expense."
          action={
            <button
              onClick={openCreateModal}
              className="btn-primary mt-4 py-2 px-4 text-xs font-semibold"
            >
              <Plus size={16} className="mr-1 inline" /> {t('addExpense') || 'Record Expense'}
            </button>
          }
        />
      ) : (
        <div className="panel overflow-hidden border-line">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm rtl:text-right">
              <thead className="border-b border-line bg-ink-950 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">{t('date')}</th>
                  <th className="py-3.5 px-4">{t('category')}</th>
                  <th className="py-3.5 px-4">{t('description')}</th>
                  <th className="py-3.5 px-4 font-mono">{t('amount')}</th>
                  <th className="py-3.5 px-4 text-right rtl:text-left">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-slate-300 text-xs sm:text-sm">
                {expenses.map((exp) => {
                  const isExpSalary =
                    Boolean(exp.employee_id) ||
                    exp.category?.toLowerCase().includes('salar') ||
                    exp.category?.toLowerCase().includes('paie');

                  return (
                    <tr key={exp.id} className="hover:bg-white/5 transition">
                      <td className="py-3 px-4 font-mono text-xs text-slate-400">
                        {new Date(exp.expense_date || exp.created_at).toLocaleDateString(
                          document.documentElement.lang || undefined
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              isExpSalary
                                ? 'bg-violet-500/15 text-violet-300 border-violet-500/30'
                                : 'bg-brand-blue/15 text-blue-300 border-brand-blue/30'
                            }`}
                          >
                            {exp.category}
                          </span>
                          {exp.employee_name && (
                            <span className="text-[11px] text-violet-300 font-medium flex items-center gap-1">
                              <Users size={12} />
                              {exp.employee_name}
                            </span>
                          )}
                          {exp.salary_period && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {exp.salary_period} ({exp.duration || '1 month'})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-200">
                        {exp.description || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-400 text-sm">
                        {formatMoney(exp.amount, currency)}
                      </td>
                      <td className="py-3 px-4 text-right rtl:text-left">
                        <div className="flex items-center justify-end rtl:justify-start gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewExpense(exp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                            title={t('viewDetails') || 'View Details'}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(exp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                            title={t('edit') || 'Edit'}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(exp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                            title={t('delete') || 'Delete'}
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

      {/* DETAILED EXPENSE MODAL */}
      {viewExpense ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-line bg-ink-900 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wallet size={18} className="text-brand-blue" />
                {t('details')}
              </h3>
              <button
                onClick={() => setViewExpense(null)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-white/5 border border-line flex items-center justify-between">
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-semibold">
                    {t('amount')}
                  </span>
                  <p className="text-2xl font-bold font-mono text-amber-400 mt-0.5">
                    {formatMoney(viewExpense.amount, currency)}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-blue/20 text-brand-blue border border-brand-blue/30">
                  {viewExpense.category}
                </span>
              </div>

              <div className="space-y-2 p-3.5 rounded-xl border border-line bg-ink-950">
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">{t('paymentDate')}:</span>
                  <span className="text-white font-mono">
                    {new Date(
                      viewExpense.expense_date || viewExpense.created_at
                    ).toLocaleDateString(document.documentElement.lang || undefined)}
                  </span>
                </div>

                {viewExpense.employee_name && (
                  <div className="flex justify-between py-1 border-t border-line/60">
                    <span className="text-slate-400">{t('employee')}:</span>
                    <span className="text-violet-300 font-semibold">
                      {viewExpense.employee_name}
                    </span>
                  </div>
                )}

                {viewExpense.salary_period && (
                  <div className="flex justify-between py-1 border-t border-line/60">
                    <span className="text-slate-400">{t('salaryPeriod')}:</span>
                    <span className="text-white font-mono">
                      {viewExpense.salary_period}
                    </span>
                  </div>
                )}

                {viewExpense.duration && (
                  <div className="flex justify-between py-1 border-t border-line/60">
                    <span className="text-slate-400">{t('duration')}:</span>
                    <span className="text-white">{viewExpense.duration}</span>
                  </div>
                )}

                {viewExpense.description && (
                  <div className="py-2 border-t border-line/60">
                    <span className="text-slate-400 block mb-1">{t('description')}:</span>
                    <p className="text-slate-200">{viewExpense.description}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => {
                    const e = viewExpense;
                    setViewExpense(null);
                    handleDelete(e);
                  }}
                  className="btn-ghost py-2 px-3 text-xs text-red-400 flex items-center gap-1.5"
                >
                  <Trash2 size={14} /> {t('delete')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const e = viewExpense;
                    setViewExpense(null);
                    openEditModal(e);
                  }}
                  className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Edit2 size={14} /> {t('edit')}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* DUPLICATE SALARY CONFIRMATION WARNING MODAL */}
      {duplicateWarning ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-2xl border border-amber-500/40 bg-ink-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-base font-bold text-white">
                {t('duplicateSalaryTitle')}
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {t('duplicateSalaryWarning')}
            </p>

            <div className="p-3.5 rounded-xl border border-line bg-ink-950 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">{t('employee')}:</span>
                <span className="text-white font-semibold">{duplicateWarning.employeeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t('salaryPeriod')}:</span>
                <span className="text-white font-mono">{duplicateWarning.salaryPeriod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t('amount')}:</span>
                <span className="text-amber-400 font-bold font-mono">
                  {formatMoney(duplicateWarning.amount, currency)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-line">
              <button
                type="button"
                onClick={() => setDuplicateWarning(null)}
                className="btn-ghost py-2 px-4 text-xs font-semibold"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => executeSubmit(duplicateWarning.payload, true)}
                className="btn-primary bg-amber-500 hover:bg-amber-600 text-ink-950 font-bold py-2 px-4 text-xs flex items-center gap-1.5"
              >
                {submitting ? <Spinner size={14} /> : <Check size={14} />}
                {t('confirmAction')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* CREATE / EDIT EXPENSE MODAL */}
      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-line bg-ink-900 p-6 shadow-2xl overflow-y-auto max-h-[92vh]">
            <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wallet size={18} className="text-brand-blue" />
                {editingExpense
                  ? `${t('edit')}: ${editingExpense.category}`
                  : (t('addExpense') || 'Record Expense')}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <Alert>{error}</Alert>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  {t('category')} *
                </label>
                <input
                  type="text"
                  list="expense-category-suggestions"
                  required
                  value={formData.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  placeholder={t('enterExpenseName')}
                  className="input-field py-2 text-sm"
                />
                <datalist id="expense-category-suggestions">
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>

              {/* EMPLOYEE SALARY FIELDS (Shown when category is Salary) */}
              {isSalary && (
                <div className="p-3.5 rounded-xl border border-violet-500/30 bg-violet-500/10 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-violet-300 uppercase">
                    <Briefcase size={14} />
                    <span>{t('salary') || 'Salary Payment'}</span>
                  </div>

                  {/* Employee Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-violet-200 mb-1">
                      {t('employee')} *
                    </label>
                    <select
                      value={formData.employeeId}
                      onChange={(e) => handleEmployeeChange(e.target.value)}
                      required={isSalary}
                      className="input-field py-2 text-sm bg-ink-950 border-violet-500/30"
                    >
                      <option value="">{`-- ${t('selectEmployee')} --`}</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} {emp.position ? `(${emp.position})` : ''} -{' '}
                          {formatMoney(emp.baseSalary || emp.base_salary || 0, currency)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Salary Period & Duration */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-violet-200 mb-1">
                        {t('salaryPeriod')}
                      </label>
                      <input
                        type="month"
                        value={formData.salaryPeriod}
                        onChange={(e) =>
                          setFormData({ ...formData, salaryPeriod: e.target.value })
                        }
                        className="input-field py-2 text-xs bg-ink-950 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-violet-200 mb-1">
                        {t('duration')}
                      </label>
                      <input
                        type="text"
                        value={formData.duration}
                        onChange={(e) =>
                          setFormData({ ...formData, duration: e.target.value })
                        }
                        placeholder="1 month"
                        className="input-field py-2 text-xs bg-ink-950"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  {t('amount')} ({currency}) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="input-field py-2 text-sm font-mono"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  {isSalary ? t('paymentDate') : t('date')} *
                </label>
                <input
                  type="date"
                  required
                  value={formData.expenseDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expenseDate: e.target.value })
                  }
                  className="input-field py-2 text-sm"
                />
              </div>

              {/* Period Type (for regular non-salary expenses) */}
              {!isSalary && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      {t('expensePeriod')}
                    </label>
                    <select
                      value={formData.period}
                      onChange={(e) =>
                        setFormData({ ...formData, period: e.target.value })
                      }
                      className="input-field py-2 text-sm"
                    >
                      <option value="one_time">{t('oneTime')}</option>
                      <option value="daily">{t('daily')}</option>
                      <option value="monthly">{t('monthly')}</option>
                      <option value="yearly">{t('yearly')}</option>
                      <option value="custom">{t('customDateRange')}</option>
                    </select>
                  </div>

                  {formData.period === 'custom' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                        {t('periodEnd')}
                      </label>
                      <input
                        type="date"
                        required
                        min={formData.expenseDate}
                        value={formData.periodEnd}
                        onChange={(e) =>
                          setFormData({ ...formData, periodEnd: e.target.value })
                        }
                        className="input-field py-2 text-sm"
                      />
                    </div>
                  )}
                </>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  {t('description')}
                </label>
                <input
                  type="text"
                  placeholder={
                    isSalary ? 'e.g. September Salary Payment' : t('exampleExpenseNotes')
                  }
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="input-field py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-ghost py-2 px-4 text-xs font-semibold"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary py-2 px-5 text-xs font-semibold"
                >
                  {submitting ? <Spinner size={16} /> : (t('saveExpense') || 'Save Expense')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
