import axios from 'axios'

export const api = axios.create({
  baseURL: 'https://reachflow-j34o.onrender.com/api',
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('rf_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})
