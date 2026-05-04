import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
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
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
      return Promise.reject(data || { message: '请求失败' })
    }
    return Promise.reject({ message: '网络错误' })
  }
)

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data)
}

export const newsApi = {
  getList: (params) => api.get('/news', { params }),
  getHot: (params) => api.get('/news/hot', { params }),
  getDetail: (id) => api.get(`/news/${id}`),
  getCategories: () => api.get('/news/categories')
}

export const commentApi = {
  getByNews: (newsId, params) => api.get(`/comments/news/${newsId}`, { params }),
  create: (data) => api.post('/comments', data),
  delete: (id) => api.delete(`/comments/${id}`)
}

export const userApi = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  updatePassword: (data) => api.put('/user/password', data),
  getHistory: () => api.get('/user/history'),
  getTags: () => api.get('/user/tags'),
  getComments: () => api.get('/user/comments')
}

export const recommendApi = {
  getRecommend: (params) => api.get('/recommend', { params }),
  getStats: () => api.get('/recommend/stats')
}

export default api
