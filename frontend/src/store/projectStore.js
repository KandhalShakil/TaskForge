import { create } from 'zustand'
import { projectsAPI } from '../api/projects'

export const useProjectStore = create((set, get) => ({
  projects: [],
  spaces: [],
  folders: [],
  hierarchy: [],
  folderProjects: {},
  folderProjectsLoading: {},
  activeProject: null,
  notFoundProjectIds: {},
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

  fetchSpaces: async (workspaceId) => {
    try {
      const { data } = await projectsAPI.listSpaces({ workspace: workspaceId })
      const spacesList = data.results || data
      set({ spaces: spacesList })
      return spacesList
    } catch {
      return []
    }
  },

  fetchFolders: async ({ workspaceId, spaceId } = {}) => {
    try {
      const params = {
        ...(workspaceId && { workspace: workspaceId }),
        ...(spaceId && { space: spaceId }),
      }
      const { data } = await projectsAPI.listFolders(params)
      const foldersList = data.results || data
      set({ folders: foldersList })
      return foldersList
    } catch {
      return []
    }
  },

  fetchHierarchy: async (workspaceId) => {
    if (!workspaceId) {
      set({ hierarchy: [], spaces: [], folders: [] })
      return []
    }

    try {
      const { data } = await projectsAPI.hierarchy({ workspace: workspaceId })
      const hierarchy = data || []
      const spaces = hierarchy.map((space) => ({
        id: space.id,
        workspace: space.workspace,
        name: space.name,
        description: space.description,
        icon: space.icon,
        color: space.color,
        order: space.order,
      }))
      const folders = hierarchy.flatMap((space) =>
        (space.folders || []).map((folder) => ({
          id: folder.id,
          workspace: folder.workspace,
          space: folder.space,
          name: folder.name,
          description: folder.description,
          icon: folder.icon,
          color: folder.color,
          order: folder.order,
        }))
      )
      const projects = hierarchy.flatMap((space) => {
        const rootLists = (space.lists || []).map((list) => ({ ...list, space: space.id, folder: null }))
        const folderLists = (space.folders || []).flatMap((folder) =>
          (folder.lists || []).map((list) => ({ ...list, space: space.id, folder: folder.id }))
        )
        return [...rootLists, ...folderLists]
      })

      set({ hierarchy, spaces, folders, projects })
      return hierarchy
    } catch {
      set({ hierarchy: [], spaces: [], folders: [] })
      return []
    }
  },

  fetchProjectsByFolder: async ({ workspaceId, folderId, force = false, debug = false }) => {
    if (!workspaceId || !folderId) {
      return []
    }

    const { folderProjects, folderProjectsLoading } = get()
    const hasCache = Array.isArray(folderProjects[folderId])
    if (!force && hasCache) {
      return folderProjects[folderId]
    }

    if (folderProjectsLoading[folderId]) {
      return folderProjects[folderId] || []
    }

    set((state) => ({
      folderProjectsLoading: {
        ...state.folderProjectsLoading,
        [folderId]: true,
      },
    }))

    try {
      const { data } = await projectsAPI.listByFolder({ workspace: workspaceId, folder: folderId })
      const fetchedProjects = data?.results || data || []

      if (debug) {
        console.debug('[Sidebar][FolderProjects] API response', {
          folderId,
          count: fetchedProjects.length,
          projects: fetchedProjects,
        })
      }

      set((state) => ({
        folderProjects: {
          ...state.folderProjects,
          [folderId]: fetchedProjects,
        },
      }))

      return fetchedProjects
    } catch (error) {
      if (debug) {
        console.debug('[Sidebar][FolderProjects] API error', { folderId, error })
      }
      throw error
    } finally {
      set((state) => ({
        folderProjectsLoading: {
          ...state.folderProjectsLoading,
          [folderId]: false,
        },
      }))
    }
  },

  createSpace: async (spaceData) => {
    set({ isSubmitting: true })
    try {
      const { data } = await projectsAPI.createSpace(spaceData)
      set((state) => ({ spaces: [data, ...state.spaces], isSubmitting: false }))
      return data
    } catch (err) {
      set({ isSubmitting: false })
      throw err
    }
  },

  createFolder: async (folderData) => {
    set({ isSubmitting: true })
    try {
      const { data } = await projectsAPI.createFolder(folderData)
      set((state) => ({ folders: [data, ...state.folders], isSubmitting: false }))
      return data
    } catch (err) {
      set({ isSubmitting: false })
      throw err
    }
  },

  setActiveProject: (project) => set({ activeProject: project }),

  fetchProjectById: async (projectId) => {
    const { projects, activeProject, notFoundProjectIds } = get()

    if (notFoundProjectIds[projectId]) {
      const cachedNotFoundError = new Error('Project not found')
      cachedNotFoundError.response = { status: 404 }
      cachedNotFoundError.isCachedNotFound = true
      throw cachedNotFoundError
    }

    if (activeProject?.id === projectId) {
      return activeProject
    }

    const existingProject = projects.find((p) => p.id === projectId)
    if (existingProject) {
      set({ activeProject: existingProject })
      return existingProject
    }

    try {
      const { data } = await projectsAPI.get(projectId)
      set((state) => {
        if (!state.notFoundProjectIds[projectId]) {
          return { activeProject: data }
        }

        const nextNotFound = { ...state.notFoundProjectIds }
        delete nextNotFound[projectId]
        return { activeProject: data, notFoundProjectIds: nextNotFound }
      })
      return data
    } catch (err) {
      if (err?.response?.status === 404) {
        set((state) => ({
          notFoundProjectIds: {
            ...state.notFoundProjectIds,
            [projectId]: true,
          },
        }))
      }
      console.error('Failed to fetch project:', err)
      throw err
    }
  },

  getProjectById: (projectId) => {
    const { projects, activeProject } = get()
    return activeProject?.id === projectId ? activeProject : projects.find((p) => p.id === projectId)
  },

  clear: () => set({
    projects: [],
    spaces: [],
    folders: [],
    hierarchy: [],
    folderProjects: {},
    folderProjectsLoading: {},
    activeProject: null,
    notFoundProjectIds: {},
    loading: false,
    isSubmitting: false,
  }),
}))
