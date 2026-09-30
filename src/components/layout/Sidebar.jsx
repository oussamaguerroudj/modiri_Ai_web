import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  CalendarClock,
  ShoppingCart,
  Wallet,
  BarChart3,
  Settings,
  Users,
  Package,
  Receipt,
  Truck,
  Sparkles,
  ScanLine,
  UserCheck,
  Calendar,
  FolderKanban,
  BookOpen,
  LineChart,
  Crown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function getNavItemsForBusinessType(businessType, t = (k) => k) {
  // Restaurant / Cafe family
  if (businessType === 'restaurant' || businessType === 'cafe') {
    return [
      { to: '/', label: t('navDashboard') || 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/restaurant/orders', label: t('ordersTitle') || 'Orders', icon: ShoppingCart },
      { to: '/restaurant/tables', label: t('tablesTitle') || 'Tables', icon: UtensilsCrossed },
      { to: '/restaurant/menu', label: t('menuAndRecipes') || 'Menu & Recipes', icon: ClipboardList },
      { to: '/restaurant/reservations', label: t('reservations') || 'Reservations', icon: CalendarClock },
      { to: '/restaurant/inventory', label: t('kitchenInventory') || 'Kitchen Stock', icon: Package },
      { to: '/expenses', label: t('moreExpenses') || 'Expenses', icon: Wallet },
      { to: '/employees', label: t('moreEmployees') || 'Staff', icon: Users },
      { to: '/reports', label: t('moreReports') || 'Reports', icon: BarChart3 },
      { to: '/ai/assistant', label: t('moreAiAssistant') || 'AI Assistant', icon: Sparkles },
      { to: '/ai/scanner', label: t('aiScanner') || 'AI Invoice Scan', icon: ScanLine },
      { to: '/settings', label: t('moreSettings') || 'Settings', icon: Settings },
    ];
  }

  // Clinic / Dental clinic family
  if (businessType === 'clinic' || businessType === 'dental_clinic') {
    return [
      { to: '/', label: t('navDashboard') || 'Clinic Dashboard', icon: LayoutDashboard, end: true },
      { to: '/appointments', label: t('moreAppointments') || 'Appointments', icon: Calendar },
      { to: '/clinic/patients', label: t('clinicPatientsTitle') || 'Patients', icon: Users },
      { to: '/clinic/queue', label: t('waitingRoom') || 'Waiting Room', icon: UserCheck },
      { to: '/expenses', label: t('moreExpenses') || 'Expenses', icon: Wallet },
      { to: '/employees', label: t('staffAndDoctors') || 'Staff & Doctors', icon: Users },
      { to: '/reports', label: t('moreReports') || 'Reports', icon: BarChart3 },
      { to: '/ai/assistant', label: t('moreAiAssistant') || 'AI Assistant', icon: Sparkles },
      { to: '/settings', label: t('moreSettings') || 'Settings', icon: Settings },
    ];
  }

  // Enterprise / Company family
  if (businessType === 'company') {
    return [
      { to: '/', label: t('navDashboard') || 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/enterprise/projects', label: t('projects') || 'Projects', icon: FolderKanban },
      { to: '/invoices', label: t('moreInvoices') || 'Invoices', icon: Receipt },
      { to: '/expenses', label: t('moreExpenses') || 'Expenses', icon: Wallet },
      { to: '/employees', label: t('moreEmployees') || 'Employees', icon: Users },
      { to: '/reports', label: t('moreReports') || 'Reports', icon: BarChart3 },
      { to: '/ai/assistant', label: t('moreAiAssistant') || 'AI Assistant', icon: Sparkles },
      { to: '/settings', label: t('moreSettings') || 'Settings', icon: Settings },
    ];
  }

  // Core / Grocery / Pharmacy / Clothing / Retail family
  return [
    { to: '/', label: t('navDashboard') || 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/sales', label: t('salesAndPos') || 'Sales & POS', icon: ShoppingCart },
    { to: '/products', label: t('productsAndStock') || 'Products & Stock', icon: Package },
    { to: '/credit', label: t('creditLedger') || 'Credit Ledger', icon: BookOpen },
    { to: '/invoices', label: t('moreInvoices') || 'Invoices', icon: Receipt },
    { to: '/expenses', label: t('moreExpenses') || 'Expenses', icon: Wallet },
    { to: '/customers', label: t('moreCustomers') || 'Customers', icon: Users },
    { to: '/suppliers', label: t('moreSuppliers') || 'Suppliers', icon: Truck },
    { to: '/employees', label: t('moreEmployees') || 'Employees', icon: Users },
    { to: '/appointments', label: t('moreAppointments') || 'Appointments', icon: Calendar },
    { to: '/reports', label: t('moreReports') || 'Reports', icon: BarChart3 },
    { to: '/ai/scanner', label: t('aiScanner') || 'AI Scanner', icon: ScanLine },
    { to: '/ai/assistant', label: t('moreAiAssistant') || 'AI Assistant', icon: Sparkles },
    { to: '/ai/insights', label: t('aiInsights') || 'AI Insights', icon: LineChart },
    { to: '/settings', label: t('moreSettings') || 'Settings', icon: Settings },
  ];
}

export default function Sidebar({ mobile = false, onClose = () => {} }) {
  const { company } = useAuth();
  const { t } = useLanguage();
  const navItems = getNavItemsForBusinessType(company?.business_type, t);

  return (
    <aside
      className={`${
        mobile ? 'flex w-72 flex-col h-full' : 'hidden w-64 shrink-0 flex-col border-r border-line bg-ink-900/90 px-4 py-6 lg:flex'
      }`}
    >
      <div className="mb-6 flex items-center gap-3 px-2">
        <img
          src="/logo.png"
          alt="Modiri AI Logo"
          className="h-9 w-9 rounded-xl object-contain drop-shadow"
        />
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-white flex items-center gap-1">
            MODIRI <span className="font-semibold text-brand-blue">AI</span>
          </span>
          <span className="text-[11px] font-medium text-slate-400 capitalize truncate max-w-[140px]">
            {company?.name || 'Smart Business'}
          </span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto pr-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={mobile ? onClose : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-brand-gradient text-white shadow-glow'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={18} className="shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-4 rounded-2xl border border-brand-amber/30 bg-gradient-to-br from-amber-500/10 to-transparent p-3 shrink-0">
        <div className="mb-1 flex items-center gap-2 text-brand-amber">
          <Crown size={16} />
          <span className="text-xs font-semibold text-white">{t('businessPlan') || 'Business Plan'}</span>
        </div>
        <p className="text-[11px] text-slate-400">
          {company?.currency || 'DZD'} · {company?.business_type || 'General'}
        </p>
      </div>
    </aside>
  );
}
