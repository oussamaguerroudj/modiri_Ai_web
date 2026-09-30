import { apiClient } from './client';

export async function getProducts(params = {}) {
  const { data } = await apiClient.get('/products', { params });
  return data.data || [];
}

export async function getProductById(id) {
  const { data } = await apiClient.get(`/products/${id}`);
  return data.data;
}

export async function getProductByBarcode(code) {
  const { data } = await apiClient.get(`/products/barcode/${code}`);
  return data.data;
}

export async function createProduct(payload) {
  // payload: { name, category, purchasePrice, sellingPrice, quantity, minimumStock, supplierId, barcode, imageUrl, expirationDate, size, color, brand }
  const { data } = await apiClient.post('/products', payload);
  return data.data;
}

export async function updateProduct(id, payload) {
  const { data } = await apiClient.put(`/products/${id}`, payload);
  return data.data;
}

export async function deleteProduct(id) {
  const { data } = await apiClient.delete(`/products/${id}`);
  return data.data;
}
