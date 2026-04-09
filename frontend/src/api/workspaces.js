import api from './axiosInstance'

export const workspacesAPI = {
  list: () => api.get('/workspaces/'),
  create: (data) => api.post('/workspaces/', data),
  listMembers: (id) => api.get(`/workspaces/${id}/members/`),
  addMember: (id, data) => api.post(`/workspaces/${id}/members/add/`, data),
  removeMember: (id, userId) => api.delete(`/workspaces/${id}/members/${userId}/remove/`),
  updateMemberRole: (id, userId, data) => api.patch(`/workspaces/${id}/members/${userId}/role/`, data),
  listInvitations: () => api.get('/workspaces/invitations/'),
  respondToInvitation: (id, action) => api.post(`/workspaces/invitations/${id}/respond/`, { action }),
}
