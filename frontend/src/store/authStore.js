import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => {
    localStorage.removeItem('rf_token')
    set({ user: null })
    window.location.href = '/login'
  },
}))

