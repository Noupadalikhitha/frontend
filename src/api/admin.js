import api from './axios'

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getRoles: () => api.get('/admin/roles'),
  activateUser: (id) => api.put(`/admin/users/${id}/activate`),
  updateUserRole: (id, roleId) => api.put(`/admin/users/${id}/role`, null, { params: { role_id: roleId } }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  createUser: (data) => api.post('/admin/users', data),
}

