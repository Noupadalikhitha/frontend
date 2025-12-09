import api from './axios'

export const financeAPI = {
  getExpenses: (params) => api.get('/finance/expenses', { params }),
  getExpense: (id) => api.get(`/finance/expenses/${id}`),
  createExpense: (data) => api.post('/finance/expenses', data),
  updateExpense: (id, data) => api.put(`/finance/expenses/${id}`, data),
  deleteExpense: (id) => api.delete(`/finance/expenses/${id}`),
  getRevenue: (params) => api.get('/finance/revenue', { params }),
  createRevenue: (data) => api.post('/finance/revenue', data),
  getBudgetCategories: () => api.get('/finance/budget-categories'),
  createBudgetCategory: (data) => api.post('/finance/budget-categories', data),
  getSummary: (params) => api.get('/finance/summary', { params }),
  getDashboard: (days) => api.get('/finance/dashboard', { params: { days } }),
  getMonthEndReport: (year, month) => api.get('/finance/reports/month-end', { params: { year, month } }),
  getProfitLossReport: (params) => api.get('/finance/reports/profit-loss', { params }),
  
  // AI Finance Endpoints
  getForecasts: () => api.get('/finance/ai/forecasts'),
  getAbnormalExpenses: () => api.get('/finance/ai/abnormal-expenses'),
  generateReport: () => api.post('/finance/ai/generate-report'),
}
