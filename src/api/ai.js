import api from './axios'

export const aiAPI = {
  query: (query) => api.post('/ai/query', { query }),
  getSalesForecast: (days) => api.get('/ai/forecast/sales', { params: { days } }),
  predictStockOut: (productId) => api.get(`/ai/inventory/predict-stock-out/${productId}`),
  getReorderRecommendation: (productId) => api.get(`/ai/inventory/recommend-reorder/${productId}`),
  getAnomalies: (entityType) => api.get(`/ai/anomalies/${entityType}`),
  getInventorySummary: () => api.post('/ai/summary/inventory'),
  getFinancialSummary: (days) => api.post('/ai/summary/financial', null, { params: { days } }),
  getRecommendations: () => api.get('/ai/recommendations'),
}



