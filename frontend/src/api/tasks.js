import api from './axiosInstance'

export const tasksAPI = {
  list: (params) => api.get('/tasks/', { params }),
  create: (data) => api.post('/tasks/', data),
  update: (id, data) => api.patch(`/tasks/${id}/`, data),
  delete: (id) => api.delete(`/tasks/${id}/`),
  bulkUpdate: (tasks) => api.patch('/tasks/bulk-update/', { tasks }),
  stats: (params) => api.get('/tasks/stats/', { params }),
  listComments: (taskId) => api.get(`/tasks/${taskId}/comments/`),
  addComment: (taskId, data) => api.post(`/tasks/${taskId}/comments/`, data),
  deleteComment: (taskId, commentId) => api.delete(`/tasks/${taskId}/comments/${commentId}/`),
  listSubtasks: (taskId) => api.get(`/tasks/${taskId}/subtasks/`),
  addSubtask: (taskId, data) => api.post(`/tasks/${taskId}/subtasks/`, data),
  updateSubtask: (id, data) => api.patch(`/tasks/subtasks/${id}/`, data),
  deleteSubtask: (id) => api.delete(`/tasks/subtasks/${id}/`),
}

export const categoriesAPI = {
  list: (params) => api.get('/categories/', { params }),
  create: (data) => api.post('/categories/', data),
}
