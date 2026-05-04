import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAdminStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      isLoggedIn: false,

      setUser: (user, token) => {
        localStorage.setItem('admin_token', token)
        set({ user, token, isLoggedIn: true })
      },

      logout: () => {
        localStorage.removeItem('admin_token')
        set({ token: null, user: null, isLoggedIn: false })
      }
    }),
    {
      name: 'admin-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isLoggedIn: state.isLoggedIn
      })
    }
  )
)
