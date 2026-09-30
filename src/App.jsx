import { Route, Routes, Navigate } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import AppLayout from './components/layout/AppLayout.jsx';

// Auth & Onboarding
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import VerifyEmailPage from './pages/auth/VerifyEmailPage.jsx';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/auth/ResetPasswordPage.jsx';
import BusinessTypePage from './pages/onboarding/BusinessTypePage.jsx';
import BusinessSetupPage from './pages/onboarding/BusinessSetupPage.jsx';

// Core Suite
import DashboardPage from './pages/DashboardPage.jsx';
import ProductsPage from './pages/products/ProductsPage.jsx';
import SalesPage from './pages/sales/SalesPage.jsx';
import CreditPage from './pages/credit/CreditPage.jsx';
import ExpensesPage from './pages/expenses/ExpensesPage.jsx';
import InvoicesPage from './pages/invoices/InvoicesPage.jsx';
import CustomersPage from './pages/customers/CustomersPage.jsx';
import SuppliersPage from './pages/suppliers/SuppliersPage.jsx';
import EmployeesPage from './pages/employees/EmployeesPage.jsx';
import AppointmentsPage from './pages/appointments/AppointmentsPage.jsx';
import ReportsPage from './pages/reports/ReportsPage.jsx';
import NotificationsPage from './pages/notifications/NotificationsPage.jsx';
import SettingsPage from './pages/settings/SettingsPage.jsx';

// Restaurant Suite
import RestaurantOrdersPage from './pages/restaurant/RestaurantOrdersPage.jsx';
import RestaurantTablesPage from './pages/restaurant/RestaurantTablesPage.jsx';
import RestaurantMenuPage from './pages/restaurant/RestaurantMenuPage.jsx';
import RestaurantReservationsPage from './pages/restaurant/RestaurantReservationsPage.jsx';
import RestaurantInventoryPage from './pages/restaurant/RestaurantInventoryPage.jsx';

// Clinic Suite
import ClinicPatientsPage from './pages/clinic/ClinicPatientsPage.jsx';
import ClinicQueuePage from './pages/clinic/ClinicQueuePage.jsx';
import ClinicPrescriptionsPage from './pages/clinic/ClinicPrescriptionsPage.jsx';

// Enterprise Suite
import EnterpriseProjectsPage from './pages/enterprise/EnterpriseProjectsPage.jsx';

// AI Suite
import AiAssistantPage from './pages/ai/AiAssistantPage.jsx';
import AiScannerPage from './pages/ai/AiScannerPage.jsx';
import AiInsightsPage from './pages/ai/AiInsightsPage.jsx';

import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected Onboarding Flows (Full-Screen, no shell) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding/business-type" element={<BusinessTypePage />} />
        <Route path="/onboarding/business-setup" element={<BusinessSetupPage />} />
      </Route>

      {/* Protected Main Application (Inside AppLayout with Sidebar & Topbar) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Main Dashboard Router */}
          <Route path="/" element={<DashboardPage />} />

          {/* Core Business Pages */}
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/credit" element={<CreditPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Restaurant Vertical Suite */}
          <Route path="/restaurant/orders" element={<RestaurantOrdersPage />} />
          <Route path="/restaurant/tables" element={<RestaurantTablesPage />} />
          <Route path="/restaurant/menu" element={<RestaurantMenuPage />} />
          <Route path="/restaurant/reservations" element={<RestaurantReservationsPage />} />
          <Route path="/restaurant/inventory" element={<RestaurantInventoryPage />} />

          {/* Legacy Restaurant route aliases */}
          <Route path="/tables" element={<Navigate to="/restaurant/tables" replace />} />
          <Route path="/menu" element={<Navigate to="/restaurant/menu" replace />} />
          <Route path="/orders" element={<Navigate to="/restaurant/orders" replace />} />
          <Route path="/reservations" element={<Navigate to="/restaurant/reservations" replace />} />

          {/* Clinic Vertical Suite */}
          <Route path="/clinic/patients" element={<ClinicPatientsPage />} />
          <Route path="/clinic/queue" element={<ClinicQueuePage />} />
          <Route path="/clinic/prescriptions" element={<ClinicPrescriptionsPage />} />

          {/* Enterprise Vertical Suite */}
          <Route path="/enterprise/projects" element={<EnterpriseProjectsPage />} />

          {/* AI Suite */}
          <Route path="/ai/assistant" element={<AiAssistantPage />} />
          <Route path="/ai/scanner" element={<AiScannerPage />} />
          <Route path="/ai/insights" element={<AiInsightsPage />} />
        </Route>
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
