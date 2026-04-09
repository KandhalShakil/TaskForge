import { create } from 'zustand'
import { projectsAPI } from '../api/projects'

export const useProjectStore = create((set, get) => ({
  projects: [],
  activeProject: null,
  loading: false,
  isSubmitting: false,

  fetchProjects: async (workspaceId) => {
    set({ loading: true })
    try {
      const { data } = await projectsAPI.list({ workspace: workspaceId })
      const projectsList = data.results || data
      set({ projects: projectsList, loading: false })
    } catch (err) {
      set({ loading: false })
    }
  },

  createProject: async (projectData) => {
    set({ isSubmitting: true })
    try {
      const { data } = await projectsAPI.create(projectData)
      set((state) => ({ projects: [data, ...state.projects], isSubmitting: false }))
      return data
    } catch (err) {
      set({ isSubmitting: false })
      throw err
    }
  },

  setActiveProject: (project) => set({ activeProject: project }),
}))
