import api from './axiosInstance'

export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  verifyRegistration: (data) => api.post('/auth/register/verify/', data),
  verifyEmail: (data) => api.post('/auth/verify-email/', data),
  resendOTP: (data) => api.post('/auth/register/resend-otp/', data),
  forgotPassword: (data) => api.post('/auth/forgot-password/', data),
  resetPassword: (data) => api.post('/auth/forgot-password/reset/', data),
  login: (data) => api.post('/auth/login/', data),
  logout: (refreshToken) => api.post('/auth/logout/', { refresh: refreshToken }),
  me: () => api.get('/auth/me/'),
  updateProfile: (data) => api.patch('/auth/me/', data),
  listUsers: () => api.get('/auth/users/'),
}
