import { create } from 'zustand'
import { api } from '@/lib/api'

export const useAuthStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  fetchMe: async () => {
    try {
      const res = await api.get('/auth/me')
      set({ user: res.data.user })
    } catch {
      set({ user: null })
    }
  },
  logout: () => {
    localStorage.removeItem('rf_token')
    set({ user: null })
    window.location.href = '/login'
  },
}))

