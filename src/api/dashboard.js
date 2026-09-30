import { apiClient } from './client';

// Mirrors backend/src/modules/dashboard/dashboard.routes.js -> GET /dashboard
export async function getDashboardSummary() {
  const { data } = await apiClient.get('/dashboard');
  return data.data;
  // {
  //   todayRevenue, todayExpenses, todayProfit, salesCount, lowStockCount,
  //   unpaidInvoicesCount, upcomingAppointmentsCount, totalOutstandingCredit
  // }
}
