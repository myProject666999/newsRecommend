import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUserStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      isLoggedIn: false,

      setUser: (user, token) => {
        localStorage.setItem('token', token)
        set({ user, token, isLoggedIn: true })
      },

      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData }
        }))
      },

      logout: () => {
        localStorage.removeItem('token')
        set({ token: null, user: null, isLoggedIn: false })
      }
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isLoggedIn: state.isLoggedIn
      })
    }
  )
)
