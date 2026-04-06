import { create } from 'zustand'
import { projectsAPI } from '../api/projects'

export const useProjectStore = create((set, get) => ({
  projects: [],
  activeProject: null,
  loading: false,

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
    const { data } = await projectsAPI.create(projectData)
    set((state) => ({ projects: [data, ...state.projects] }))
    return data
  },

  updateProject: async (id, projectData) => {
    const { data } = await projectsAPI.update(id, projectData)
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? data : p)),
      activeProject: state.activeProject?.id === id ? data : state.activeProject,
    }))
    return data
  },

  deleteProject: async (id) => {
    await projectsAPI.delete(id)
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      activeProject: state.activeProject?.id === id ? null : state.activeProject,
    }))
  },

  setActiveProject: (project) => set({ activeProject: project }),
}))
