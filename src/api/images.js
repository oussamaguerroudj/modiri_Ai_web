import { apiClient, API_BASE_URL } from './client';

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result || '';
      const base64 = typeof result === 'string' && result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

export async function uploadImage(file, namespace = 'restaurant-menu') {
  const allowed = ['products', 'restaurant-menu', 'restaurant-inventory'];
  const ns = allowed.includes(namespace) ? namespace : 'restaurant-menu';
  const fileBase64 = await fileToBase64(file);
  let mimeType = file.type || 'image/jpeg';
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
    mimeType = 'image/jpeg';
  }

  const { data } = await apiClient.post('/images', {
    namespace: ns,
    fileBase64,
    mimeType,
  });
  return data.data; // { imageUrl }
}

export function getFullImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('data:image') || url.startsWith('blob:')) return url;

  // If it's a backend storageKey (e.g., "restaurant-menu/comp-id/uuid.ext" or "products/comp-id/uuid.ext")
  if (url.startsWith('restaurant-') || url.startsWith('products/')) {
    return `/api/images/file?key=${encodeURIComponent(url)}`;
  }

  if (url.startsWith('/api')) {
    return url;
  }
  return `/api/${url.startsWith('/') ? url.slice(1) : url}`;
}
