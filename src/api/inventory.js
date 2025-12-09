import api from './axios'

export const inventoryAPI = {
  getProducts: (params) => api.get('/inventory/products', { params }),
  getProduct: (id) => api.get(`/inventory/products/${id}`),
  createProduct: (data) => api.post('/inventory/products', data),
  updateProduct: (id, data) => api.put(`/inventory/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/inventory/products/${id}`),
  getLowStock: () => api.get('/inventory/products/low-stock/list'),
  getAnalytics: () => api.get('/inventory/products/analytics/dashboard'),
  getCategories: (params) => api.get('/inventory/categories', { params }),
  createCategory: (data) => api.post('/inventory/categories', data),
  updateCategory: (id, data) => api.put(`/inventory/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/inventory/categories/${id}`),
  getSuppliers: (params) => api.get('/inventory/suppliers', { params }),
  createSupplier: (data) => api.post('/inventory/suppliers', data),
  updateSupplier: (id, data) => api.put(`/inventory/suppliers/${id}`, data),
  deleteSupplier: (id) => api.delete(`/inventory/suppliers/${id}`),
  // AI-powered inventory features
  getStockShortagePredictions: (daysAhead = 30) => api.get(`/inventory/ai/stock-shortage-predictions?days_ahead=${daysAhead}`),
  getReorderRecommendations: () => api.get('/inventory/ai/reorder-recommendations'),
  getInventorySummary: () => api.post('/inventory/ai/inventory-summary'),
}


