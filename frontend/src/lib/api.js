import axios from 'axios'

export const api = axios.create({
  baseURL: 'http://localhost:4000/api',
})

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('rf_token') 
    : null
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

