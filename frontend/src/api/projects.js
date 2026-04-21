import api from './axiosInstance'

export const projectsAPI = {
  list: (params) => api.get('/projects/', { params }),
  listByFolder: ({ workspace, folder }) => api.get('/projects/', { params: { workspace, folder } }),
  create: (data) => api.post('/projects/', data),
  get: (id) => api.get(`/projects/${id}/`),
  update: (id, data) => api.patch(`/projects/${id}/`, data),
  listSpaces: (params) => api.get('/projects/spaces/', { params }),
  createSpace: (data) => api.post('/projects/spaces/', data),
  updateSpace: (id, data) => api.patch(`/projects/spaces/${id}/`, data),
  listFolders: (params) => api.get('/projects/folders/', { params }),
  createFolder: (data) => api.post('/projects/folders/', data),
  updateFolder: (id, data) => api.patch(`/projects/folders/${id}/`, data),
  hierarchy: (params) => api.get('/projects/hierarchy/', { params }),
}
