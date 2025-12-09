import api from './axios'

export const employeeAPI = {
  getEmployees: (params) => api.get('/employees/employees', { params }),
  getEmployee: (id) => api.get(`/employees/employees/${id}`),
  createEmployee: (data) => api.post('/employees/employees', data),
  updateEmployee: (id, data) => api.put(`/employees/employees/${id}`, data),
  deleteEmployee: (id) => api.delete(`/employees/employees/${id}`),
  getAttendance: (params) => api.get('/employees/attendance', { params }),
  createAttendance: (data) => api.post('/employees/attendance', data),
  updateAttendance: (id, data) => api.put(`/employees/attendance/${id}`, data),
  deleteAttendance: (id) => api.delete(`/employees/attendance/${id}`),
  getAttendanceStats: (employeeId, params) => api.get(`/employees/employees/${employeeId}/attendance/stats`, { params }),
  getTimesheet: (employeeId, year, month) => api.get(`/employees/employees/${employeeId}/timesheet`, { params: { year, month } }),
  createMonthlySalary: (data) => api.post('/employees/employees/monthly-salary', data),
  getMonthlySalaries: (employeeId, params) => api.get(`/employees/employees/${employeeId}/monthly-salary`, { params }),
  createMonthlyPerformance: (data) => api.post('/employees/employees/monthly-performance', data),
  getMonthlyPerformance: (employeeId, params) => api.get(`/employees/employees/${employeeId}/monthly-performance`, { params }),
  getPayroll: (params) => api.get('/employees/payroll', { params }),
  createPayroll: (data) => api.post('/employees/payroll', data),
  
  // AI Features
  getPerformanceAnomalies: () => api.get('/employees/ai/performance-anomalies'),
  generateHRReport: () => api.post('/employees/ai/hr-report'),
  getTrainingRecommendations: () => api.post('/employees/ai/training-recommendations'),
}
