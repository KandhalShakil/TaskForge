import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authAPI } from '../api/auth'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (credentials) => {
        const { data } = await authAPI.login(credentials)
        const { user, access, refresh } = data
        localStorage.setItem('access_token', access)
        localStorage.setItem('refresh_token', refresh)
        set({ user, accessToken: access, refreshToken: refresh, isAuthenticated: true })
        return user
      },

      register: async (userData) => {
        const { data } = await authAPI.register(userData)
        return data // Return the message and email
      },

      verifyRegistration: async (verificationData) => {
        const { data } = await authAPI.verifyRegistration(verificationData)
        const { user, access, refresh } = data
        localStorage.setItem('access_token', access)
        localStorage.setItem('refresh_token', refresh)
        set({ user, accessToken: access, refreshToken: refresh, isAuthenticated: true })
        return user
      },

      resendOTP: async (email) => {
        const { data } = await authAPI.resendOTP({ email })
        return data
      },

      logout: async () => {
        const refreshToken = localStorage.getItem('refresh_token')
        try {
          if (refreshToken) await authAPI.logout(refreshToken)
        } catch (_) {}
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },

      fetchMe: async () => {
        const { data } = await authAPI.me()
        set({ user: data })
        return data
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
