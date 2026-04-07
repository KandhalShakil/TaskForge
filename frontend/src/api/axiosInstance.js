import axios from 'axios'

import toast from 'react-hot-toast'
import { useLoadingStore } from '../store/useLoadingStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const axiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT access token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    // Start global loading
    useLoadingStore.getState().startLoading()

    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    useLoadingStore.getState().stopLoading()
    return Promise.reject(error)
  }
)

// Auto-refresh token on 401
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

axiosInstance.interceptors.response.use(
  (response) => {
    // Stop global loading
    useLoadingStore.getState().stopLoading()
    return response
  },
  async (error) => {
    // Stop global loading
    useLoadingStore.getState().stopLoading()
    const originalRequest = error.config

    // If 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't intercept if we're already on login/register pages
      if (window.location.pathname === '/login' || window.location.pathname === '/register') {
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return axiosInstance(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        toast.error('Session expired. Please login again.')
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('auth-storage')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post(`${API_URL}/api/auth/refresh/`, {
          refresh: refreshToken,
        })
        const newAccessToken = data.access
        localStorage.setItem('access_token', newAccessToken)
        processQueue(null, newAccessToken)
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        toast.error('Session expired. Please login again.')
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('auth-storage')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
