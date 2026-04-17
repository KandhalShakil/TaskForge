import api from './axiosInstance'

export const chatAPI = {
  getContext: (params) => api.get('/chat/context/', { params }),
  listThreads: (params) => api.get('/chat/threads/', { params }),
  listMessages: (params) => api.get('/chat/messages/', { params }),
  sendMessage: (data) => api.post('/chat/send-message/', data),
  editMessage: (messageId, data) => api.patch(`/chat/messages/${messageId}/`, data),
  deleteMessage: (messageId) => api.delete(`/chat/messages/${messageId}/`),
  markRead: (data) => api.post('/chat/messages/read/', data),
  uploadAttachment: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/chat/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}