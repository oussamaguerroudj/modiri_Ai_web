import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  CalendarCheck,
  Award,
  DollarSign,
  X,
  Check,
  Briefcase,
  UserCheck,
} from 'lucide-react';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  markAttendance,
  addSalaryAdjustment,
} from '../../api/employees';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { formatMoney } from '../../utils/currency.js';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Alert from '../../components/ui/Alert.jsx';
import StatCard from '../../components/ui/StatCard.jsx';

export default function EmployeesPage() {
  const { company } = useAuth();
  const { t } = useLanguage();
  const currency = company?.currency || 'DZD';

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [baseSalary, setBaseSalary] = useState('');

  // Details & Attendance / Bonus Drawer
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [detailsData, setDetailsData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState('present');
  const [bonusType, setBonusType] = useState('bonus');
  const [bonusAmount, setBonusAmount] = useState('');
  const [bonusNote, setBonusNote] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (err) {
      setError(err.message || 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openCreateModal() {
    setEditingEmployee(null);
    setName('');
    setPosition('');
    setBaseSalary('');
    setError('');
    setModalOpen(true);
  }

  function openEditModal(emp) {
    setEditingEmployee(emp);
    setName(emp.name || '');
    setPosition(emp.position || '');
    setBaseSalary((emp.base_salary ?? emp.baseSalary ?? '').toString());
    setError('');
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !position.trim() || !baseSalary) {
      setError('Please fill all required fields.');
      return;
    }
    setSubmitting(true);
    setError('');

    const payload = {
      name: name.trim(),
      position: position.trim(),
      baseSalary: Number(baseSalary),
    };

    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, payload);
      } else {
        await createEmployee(payload);
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(emp) {
    if (!confirm(`Are you sure you want to delete employee "${emp.name}"?`)) return;
    try {
      await deleteEmployee(emp.id);
      loadData();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  }

  async function openEmployeeDetails(emp) {
    setSelectedEmployee(emp);
    setLoadingDetails(true);
    try {
      const details = await getEmployeeById(emp.id);
      setDetailsData(details);
    } catch (err) {
      alert(`Could not load details: ${err.message}`);
    } finally {
      setLoadingDetails(false);
    }
  }

  async function handleMarkAttendance(status) {
    if (!selectedEmployee) return;
    try {
      await markAttendance(selectedEmployee.id, status);
      alert(`Marked attendance as ${status}`);
      openEmployeeDetails(selectedEmployee);
    } catch (err) {
      alert(`Failed to log attendance: ${err.message}`);
    }
  }

  async function handleAddAdjustment(e) {
    e.preventDefault();
    if (!bonusAmount) return;
    try {
      await addSalaryAdjustment(selectedEmployee.id, {
        type: bonusType,
        amount: Number(bonusAmount),
        note: bonusNote.trim() || undefined,
      });
      setBonusAmount('');
      setBonusNote('');
      alert('Salary adjustment recorded');
      openEmployeeDetails(selectedEmployee);
    } catch (err) {
      alert(`Failed to record adjustment: ${err.message}`);
    }
  }

  const totalPayroll = employees.reduce(
    (acc, e) => acc + (Number(e.base_salary ?? e.baseSalary) || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Users className="text-brand-blue" />
            {t('employeesPayroll')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t('businessTypeCompanyDesc')}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="btn-primary self-start sm:self-auto py-2.5 px-4 text-sm font-semibold flex items-center gap-2 shadow-lg shadow-brand-blue/20"
        >
          <Plus size={18} />
          {t('newEmployee')}
        </button>
      </div>

      {error ? <div className="panel border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div> : null}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={DollarSign}
          tone="teal"
          label={t('monthlyPayroll')}
          value={formatMoney(totalPayroll, currency)}
          sublabel={t('salary')}
        />
        <StatCard
          icon={Users}
          tone="blue"
          label={t('moreEmployees')}
          value={employees.length}
          sublabel={t('active')}
        />
        <StatCard
          icon={Briefcase}
          tone="violet"
          label={t('role')}
          value={Array.from(new Set(employees.map((e) => e.position))).length}
          sublabel={t('role')}
        />
      </div>

      {/* Employees Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={32} /></div>
      ) : employees.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t('noData')}
          description={t('moreEmployees')}
          action={
            <button onClick={openCreateModal} className="btn-primary mt-4 py-2 px-4 text-xs font-semibold">
              <Plus size={16} className="mr-1 inline" /> {t('newEmployee')}
            </button>
          }
        />
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-ink-900/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">{t('moreEmployees')}</th>
                  <th className="py-3.5 px-4">{t('role')}</th>
                  <th className="py-3.5 px-4">{t('salary')}</th>
                  <th className="py-3.5 px-4 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-slate-300">
                {employees.map((emp) => {
                  const salary = Number(emp.base_salary ?? emp.baseSalary) || 0;
                  return (
                    <tr key={emp.id} className="hover:bg-white/5 transition">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-brand-gradient text-white flex items-center justify-center font-bold text-xs">
                            {emp.name[0]?.toUpperCase() || 'E'}
                          </div>
                          <span>{emp.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-300">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-line">
                          <Briefcase size={12} className="text-slate-400" />
                          {emp.position}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-100">
                        {formatMoney(salary, currency)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEmployeeDetails(emp)}
                            className="btn-ghost py-1 px-3 text-xs font-semibold flex items-center gap-1"
                          >
                            <UserCheck size={13} /> {t('details')}
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(emp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                            title={t('edit')}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(emp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                            title={t('confirmDelete')}
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

      {/* Add / Edit Employee Modal */}
      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-line bg-ink-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users size={18} className="text-brand-blue" />
                {editingEmployee ? t('edit') : t('newEmployee')}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <Alert>{error}</Alert>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  {t('fullName')} *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('exampleEmployeeName')}
                  className="input-field py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  {t('role')} *
                </label>
                <input
                  type="text"
                  required
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder={t('exampleJobTitle')}
                  className="input-field py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  {t('salary')} ({currency}) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(e.target.value)}
                  placeholder={t('exampleSalary')}
                  className="input-field py-2 text-sm font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-ghost py-2 px-4 text-xs font-semibold"
                >
                  {t('close')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary py-2 px-5 text-xs font-semibold flex items-center gap-1.5"
                >
                  {submitting ? <Spinner size={16} /> : <Check size={16} />}
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Employee Details & Attendance Drawer */}
      {selectedEmployee ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-2xl border border-line bg-ink-900 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-line pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserCheck size={20} className="text-brand-blue" />
                  {selectedEmployee.name}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedEmployee.position} · {t('salary')}: {formatMoney(selectedEmployee.base_salary ?? selectedEmployee.baseSalary, currency)}
                </p>
              </div>
              <button onClick={() => setSelectedEmployee(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {loadingDetails ? (
              <div className="flex justify-center py-16"><Spinner size={28} /></div>
            ) : (
              <div className="space-y-6">
                {/* Log Today's Attendance */}
                <div className="p-4 rounded-xl border border-line bg-white/5 space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <CalendarCheck size={15} className="text-brand-blue" /> {t('moreAppointments')}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { status: 'present', label: t('active'), color: 'hover:border-emerald-500 text-emerald-400' },
                      { status: 'absent', label: t('cancelled'), color: 'hover:border-red-500 text-red-400' },
                      { status: 'late', label: t('pending'), color: 'hover:border-amber-500 text-amber-400' },
                      { status: 'half_day', label: t('actions'), color: 'hover:border-blue-500 text-blue-400' },
                    ].map(({ status, label, color }) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => handleMarkAttendance(status)}
                        className={`p-2 rounded-lg border border-line bg-ink-900 text-xs font-semibold transition ${color}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Record Salary Adjustment (Bonus / Deduction) */}
                <div className="p-4 rounded-xl border border-line bg-white/5 space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Award size={15} className="text-brand-violet" /> {t('salary')}
                  </h4>
                  <form onSubmit={handleAddAdjustment} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">{t('category')}</label>
                        <select
                          value={bonusType}
                          onChange={(e) => setBonusType(e.target.value)}
                          className="input-field py-1.5 text-xs cursor-pointer"
                        >
                          <option value="bonus">{t('profit')} (+)</option>
                          <option value="deduction">{t('moreExpenses')} (-)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          {t('amount')} ({currency})
                        </label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={bonusAmount}
                          onChange={(e) => setBonusAmount(e.target.value)}
                          placeholder={t('exampleAmount')}
                          className="input-field py-1.5 text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <input
                        type="text"
                        value={bonusNote}
                        onChange={(e) => setBonusNote(e.target.value)}
                        placeholder={t('notesPlaceholder')}
                        className="input-field py-1.5 text-xs"
                      />
                    </div>
                    <button type="submit" className="btn-primary w-full py-2 text-xs font-semibold">
                      {t('save')}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
