import api from './axiosInstance'

export const projectsAPI = {
  list: (params) => api.get('/projects/', { params }),
  create: (data) => api.post('/projects/', data),
  get: (id) => api.get(`/projects/${id}/`),
  update: (id, data) => api.patch(`/projects/${id}/`, data),
  delete: (id) => api.delete(`/projects/${id}/`),
  listMembers: (id) => api.get(`/projects/${id}/members/`),
  addMember: (id, data) => api.post(`/projects/${id}/members/add/`, data),
  removeMember: (id, userId) => api.delete(`/projects/${id}/members/${userId}/remove/`),
}
