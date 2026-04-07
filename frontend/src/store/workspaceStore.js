import { create } from 'zustand'
import { workspacesAPI } from '../api/workspaces'

export const useWorkspaceStore = create((set, get) => ({
  workspaces: [],
  activeWorkspace: null,
  members: [],
  invitations: [],
  loading: false,
  error: null,

  fetchWorkspaces: async () => {
    set({ loading: true, error: null })
    try {
      const { data } = await workspacesAPI.list()
      const workspacesList = data.results || data
      set({ workspaces: workspacesList, loading: false })
      // Set first workspace as active if none is set
      if (!get().activeWorkspace && workspacesList.length > 0) {
        set({ activeWorkspace: workspacesList[0] })
      }
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  createWorkspace: async (workspaceData) => {
    const { data } = await workspacesAPI.create(workspaceData)
    set((state) => ({ workspaces: [data, ...state.workspaces] }))
    return data
  },

  updateWorkspace: async (id, workspaceData) => {
    const { data } = await workspacesAPI.update(id, workspaceData)
    set((state) => ({
      workspaces: state.workspaces.map((w) => (w.id === id ? data : w)),
      activeWorkspace: state.activeWorkspace?.id === id ? data : state.activeWorkspace,
    }))
    return data
  },

  deleteWorkspace: async (id) => {
    await workspacesAPI.delete(id)
    set((state) => ({
      workspaces: state.workspaces.filter((w) => w.id !== id),
      activeWorkspace: state.activeWorkspace?.id === id ? state.workspaces[0] || null : state.activeWorkspace,
    }))
  },

  setActiveWorkspace: (workspace) => set({ activeWorkspace: workspace }),

  fetchMembers: async (workspaceId) => {
    const { data } = await workspacesAPI.listMembers(workspaceId)
    const membersList = data.results || data
    set({ members: membersList })
    return membersList
  },

  addMember: async (workspaceId, memberData) => {
    const { data } = await workspacesAPI.addMember(workspaceId, memberData)
    set((state) => ({ members: [...state.members, data] }))
    return data
  },

  removeMember: async (workspaceId, userId) => {
    await workspacesAPI.removeMember(workspaceId, userId)
    set((state) => ({ members: state.members.filter((m) => m.user.id !== userId) }))
  },

  updateMemberRole: async (workspaceId, userId, role) => {
    const { data } = await workspacesAPI.updateMemberRole(workspaceId, userId, { role })
    set((state) => ({
      members: state.members.map((m) => (m.user.id === userId ? data : m)),
    }))
    return data
  },

  getUserRole: (userId) => {
    if (!userId) return 'viewer'
    const member = get().members.find((m) => m.user.id === userId)
    return member?.role || 'viewer'
  },

  isWorkspaceAdmin: (userId) => {
    const role = get().getUserRole(userId)
    return role === 'admin'
  },

  fetchInvitations: async () => {
    try {
      const { data } = await workspacesAPI.listInvitations()
      set({ invitations: data.results || data })
    } catch (err) {
      console.error('Failed to fetch invitations:', err)
    }
  },

  acceptInvitation: async (id) => {
    await workspacesAPI.respondToInvitation(id, 'accept')
    set((state) => ({
      invitations: state.invitations.filter((i) => i.id !== id),
    }))
    // Refresh workspaces to show the new one
    await get().fetchWorkspaces()
  },

  declineInvitation: async (id) => {
    await workspacesAPI.respondToInvitation(id, 'decline')
    set((state) => ({
      invitations: state.invitations.filter((i) => i.id !== id),
    }))
  },
}))
