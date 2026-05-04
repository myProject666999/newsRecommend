import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      if (status === 401) {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
        window.location.href = '/login'
      }
      return Promise.reject(data || { message: '请求失败' })
    }
    return Promise.reject({ message: '网络错误' })
  }
)

export const authApi = {
  login: (data) => api.post('/auth/login', data)
}

export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  updatePassword: (data) => api.put('/admin/password', data),
}

export const userApi = {
  getList: (params) => api.get('/admin/users', { params }),
  updateStatus: (id, status) => api.put(`/admin/users/${id}/status`, { status }),
  delete: (id) => api.delete(`/admin/users/${id}`),
}

export const newsApi = {
  getList: (params) => api.get('/admin/news', { params }),
  create: (data) => api.post('/admin/news', data),
  update: (id, data) => api.put(`/admin/news/${id}`, data),
  delete: (id) => api.delete(`/admin/news/${id}`),
}

export const commentApi = {
  getList: (params) => api.get('/admin/comments', { params }),
  updateStatus: (id, status) => api.put(`/admin/comments/${id}/status`, { status }),
  delete: (id) => api.delete(`/admin/comments/${id}`),
}

export const tagApi = {
  getList: () => api.get('/admin/tags'),
  create: (data) => api.post('/admin/tags', data),
  delete: (id) => api.delete(`/admin/tags/${id}`),
}

export const crawlApi = {
  getTasks: (params) => api.get('/admin/crawl/tasks', { params }),
  createTask: (data) => api.post('/admin/crawl/tasks', data),
}

export default api
