import api from './axios'

export const authAPI = {
  login: async (email, password) => {
    const formData = new FormData()
    formData.append('username', email)  // OAuth2 uses 'username' field but we accept email
    formData.append('password', password)
    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },
  register: async (userData) => {
    const response = await api.post('/auth/register', userData)
    return response.data
  },
  getMe: async (token = null) => {
    const config = {}
    if (token) {
      config.headers = { Authorization: `Bearer ${token}` }
    }
    const response = await api.get('/auth/me', config)
    return response.data
  },
  getPermissions: async () => {
    const response = await api.get('/auth/permissions')
    return response.data
  },
  getRoles: async () => {
    const response = await api.get('/auth/roles')
    return response.data
  },
  getDashboard: async () => {
    const response = await api.get('/auth/dashboard')
    return response.data
  },
}

