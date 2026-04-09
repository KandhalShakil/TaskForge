import api from './axiosInstance'

export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  verifyRegistration: (data) => api.post('/auth/register/verify/', data),
  resendOTP: (data) => api.post('/auth/register/resend-otp/', data),
  login: (data) => api.post('/auth/login/', data),
  logout: (refreshToken) => api.post('/auth/logout/', { refresh: refreshToken }),
  me: () => api.get('/auth/me/'),
  me: () => api.get('/auth/me/'),
  listUsers: () => api.get('/auth/users/'),
}
