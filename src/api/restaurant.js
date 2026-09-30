import { apiClient, API_BASE_URL } from './client';

// Dashboard
export async function getRestaurantDashboard() {
  const { data } = await apiClient.get('/restaurant/dashboard');
  return data.data;
}

// Tables
export async function getTables() {
  const { data } = await apiClient.get('/restaurant/tables');
  return data.data || [];
}

export async function createTable(payload) {
  // payload: { name, seats }
  const { data } = await apiClient.post('/restaurant/tables', payload);
  return data.data;
}

export async function updateTableStatus(tableId, status) {
  // status: 'available' | 'occupied' | 'reserved'
  const { data } = await apiClient.patch(`/restaurant/tables/${tableId}/status`, { status });
  return data.data;
}

export async function updateTable(tableId, payload) {
  // payload: { name, seats, status }
  const { data } = await apiClient.put(`/restaurant/tables/${tableId}`, payload);
  return data.data;
}

export async function deleteTable(tableId) {
  const { data } = await apiClient.delete(`/restaurant/tables/${tableId}`);
  return data;
}

// Menu Items & Recipes
export async function getMenuItems() {
  const { data } = await apiClient.get('/restaurant/menu-items');
  return data.data || [];
}

export async function createMenuItem(payload) {
  // payload: { name, category, price, description, isAvailable, imageUrl }
  const { data } = await apiClient.post('/restaurant/menu-items', payload);
  return data.data;
}

export async function updateMenuItem(id, payload) {
  const { data } = await apiClient.put(`/restaurant/menu-items/${id}`, payload);
  return data.data;
}

export async function setMenuItemAvailability(id, isAvailable) {
  const { data } = await apiClient.patch(`/restaurant/menu-items/${id}/availability`, { isAvailable });
  return data.data;
}

export async function deleteMenuItem(id) {
  const { data } = await apiClient.delete(`/restaurant/menu-items/${id}`);
  return data.data;
}

export async function getMenuItemIngredients(menuItemId) {
  const { data } = await apiClient.get(`/restaurant/menu-items/${menuItemId}/ingredients`);
  return data.data || [];
}

export async function setMenuItemIngredients(menuItemId, ingredients) {
  // ingredients: [{ inventoryItemId, quantity }]
  const { data } = await apiClient.put(`/restaurant/menu-items/${menuItemId}/ingredients`, { ingredients });
  return data.data;
}

// Orders
export async function getOrders() {
  const { data } = await apiClient.get('/restaurant/orders');
  return data.data || [];
}

export async function getActiveOrders() {
  const { data } = await apiClient.get('/restaurant/orders/active');
  return data.data || [];
}

export async function getOrderById(orderId) {
  const { data } = await apiClient.get(`/restaurant/orders/${orderId}`);
  return data.data;
}

export async function createOrder(payload) {
  // payload: { tableId, items: [{ menuItemId, quantity, unitPrice, notes }], notes }
  const { data } = await apiClient.post('/restaurant/orders', payload);
  return data.data;
}

export async function updateOrderStatus(orderId, status) {
  // status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled'
  const { data } = await apiClient.patch(`/restaurant/orders/${orderId}/status`, { status });
  return data.data;
}

export async function recordOrderPayment(orderId, payload) {
  // payload: { amount, method, note }
  const { data } = await apiClient.post(`/restaurant/orders/${orderId}/payments`, payload);
  return data.data;
}

export async function refundOrder(orderId, payload = {}) {
  const { data } = await apiClient.post(`/restaurant/orders/${orderId}/refund`, payload);
  return data.data;
}

export async function getOrderInvoice(orderId) {
  const { data } = await apiClient.get(`/restaurant/orders/${orderId}/invoice`);
  return data.data;
}

export function getOrderInvoicePdfUrl(orderId) {
  return `${API_BASE_URL}/restaurant/orders/${orderId}/invoice/pdf`;
}

// Reservations
export async function getReservations() {
  const { data } = await apiClient.get('/restaurant/reservations');
  return data.data || [];
}

export async function createReservation(payload) {
  // payload: { customerName, customerPhone, tableId, guestCount, reservationTime, notes }
  const { data } = await apiClient.post('/restaurant/reservations', payload);
  return data.data;
}

export async function updateReservationStatus(reservationId, status) {
  // status: 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  const { data } = await apiClient.patch(`/restaurant/reservations/${reservationId}/status`, { status });
  return data.data;
}

export async function updateReservation(reservationId, payload) {
  const { data } = await apiClient.put(`/restaurant/reservations/${reservationId}`, payload);
  return data.data;
}

export async function deleteReservation(reservationId) {
  const { data } = await apiClient.delete(`/restaurant/reservations/${reservationId}`);
  return data;
}

// Inventory
export async function getRestaurantInventory(params = {}) {
  const { data } = await apiClient.get('/restaurant/inventory', { params });
  return data.data || [];
}

export async function createRestaurantInventoryItem(payload) {
  // payload: { name, unit, currentStock, minimumStock, costPerUnit }
  const { data } = await apiClient.post('/restaurant/inventory', payload);
  return data.data;
}

export async function adjustInventoryQuantity(itemId, payload) {
  // payload: { delta, reason, notes }
  const { data } = await apiClient.post(`/restaurant/inventory/${itemId}/adjust`, payload);
  return data.data;
}

export async function archiveInventoryItem(itemId) {
  const { data } = await apiClient.delete(`/restaurant/inventory/${itemId}`);
  return data.data;
}
