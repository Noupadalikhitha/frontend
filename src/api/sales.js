import api from './axios'

export const salesAPI = {
  getOrders: (params) => api.get('/sales/orders', { params }),
  getOrder: (id) => api.get(`/sales/orders/${id}`),
  createOrder: (data) => api.post('/sales/orders', data),
  updateOrderStatus: (id, status) => api.put(`/sales/orders/${id}/status`, { status }),
  getCustomers: () => api.get('/sales/customers'),
  createCustomer: (data) => api.post('/sales/customers', data),
  getAnalytics: (days) => api.get('/sales/orders/analytics/dashboard', { params: { days } }),
  getDailyReport: (date) => api.get('/sales/orders/reports/daily', { params: { date } }),
  getWeeklyReport: (weekStart) => api.get('/sales/orders/reports/weekly', { params: { week_start: weekStart } }),
  getMonthlyReport: (year, month) => api.get('/sales/orders/reports/monthly', { params: { year, month } }),
  createPayment: (data) => api.post('/sales/payments', data),
  getOrderPayments: (orderId) => api.get(`/sales/orders/${orderId}/payments`),
  
  // AI Features
  getSalesTrends: (daysAhead = 30) => api.get('/sales/ai/sales-trends', { params: { days_ahead: daysAhead } }),
  getBestSellers: () => api.get('/sales/ai/best-sellers'),
  getUnderperformers: () => api.post('/sales/ai/underperformers'),
}

