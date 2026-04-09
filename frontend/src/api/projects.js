import api from './axiosInstance'

export const projectsAPI = {
  list: (params) => api.get('/projects/', { params }),
  create: (data) => api.post('/projects/', data),
  get: (id) => api.get(`/projects/${id}/`),
}
