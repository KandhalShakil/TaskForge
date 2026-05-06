import { create } from 'zustand'
import { projectsAPI } from '../api/projects'

export const useProjectStore = create((set, get) => ({
  projects: [],
  projectMap: {}, // O(1) lookup
  spaces: [],
  spaceMap: {},   // O(1) lookup
  folders: [],
  folderMap: {},  // O(1) lookup
  hierarchy: [],
  folderProjects: {},
  folderProjectsLoading: {},
  activeProject: null,
  projectMembers: [],
  notFoundProjectIds: {},
  loading: false,
  isSubmitting: false,

  fetchProjects: async (workspaceId) => {
    set({ projects: [], projectMap: {}, notFoundProjectIds: {}, loading: true })
    try {
      const { data } = await projectsAPI.list({ workspace: workspaceId })
      const projectsList = data.results || data
      const pMap = projectsList.reduce((acc, p) => ({ ...acc, [p.id]: p }), {})
      set({ projects: projectsList, projectMap: pMap, loading: false })
    } catch (err) {
      set({ loading: false })
    }
  },

  createProject: async (projectData) => {
    set({ isSubmitting: true })
    try {
      const { data } = await projectsAPI.create(projectData)
      set((state) => ({ 
        projects: [data, ...state.projects], 
        projectMap: { ...state.projectMap, [data.id]: data },
        isSubmitting: false 
      }))
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
      const sMap = spacesList.reduce((acc, s) => ({ ...acc, [s.id]: s }), {})
      set({ spaces: spacesList, spaceMap: sMap })
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
      const fMap = foldersList.reduce((acc, f) => ({ ...acc, [f.id]: f }), {})
      set({ folders: foldersList, folderMap: fMap })
      return foldersList
    } catch {
      return []
    }
  },

  fetchHierarchy: async (workspaceId) => {
    // Clear old state immediately to prevent stale UI / 'not found' errors
    set({ hierarchy: [], spaces: [], spaceMap: {}, folders: [], folderMap: {}, projects: [], projectMap: {}, notFoundProjectIds: {} })
    
    if (!workspaceId) {
      return []
    }

    try {
      const { data } = await projectsAPI.hierarchy({ workspace: workspaceId })
      const hierarchy = data || []
      
      const nextSpaces = []
      const nextFolders = []
      const nextProjects = []
      const sMap = {}
      const fMap = {}
      const pMap = {}

      // Optimized single-pass transformation
      hierarchy.forEach(space => {
        const sData = {
          id: space.id,
          workspace: space.workspace,
          name: space.name,
          description: space.description,
          icon: space.icon,
          color: space.color,
          order: space.order,
        }
        nextSpaces.push(sData)
        sMap[space.id] = sData

        const spaceLists = space.lists || []
        spaceLists.forEach(list => {
          const lData = { ...list, space: space.id, folder: null }
          nextProjects.push(lData)
          pMap[list.id] = lData
        })

        const folders = space.folders || []
        folders.forEach(folder => {
          const fData = {
            id: folder.id,
            workspace: folder.workspace,
            space: folder.space,
            name: folder.name,
            description: folder.description,
            icon: folder.icon,
            color: folder.color,
            order: folder.order,
          }
          nextFolders.push(fData)
          fMap[folder.id] = fData

          const folderLists = folder.lists || []
          folderLists.forEach(list => {
            const lData = { ...list, space: space.id, folder: folder.id }
            nextProjects.push(lData)
            pMap[list.id] = lData
          })
        })
      })

      set({ 
        hierarchy, 
        spaces: nextSpaces, spaceMap: sMap,
        folders: nextFolders, folderMap: fMap,
        projects: nextProjects, projectMap: pMap 
      })
      return hierarchy
    } catch {
      set({ hierarchy: [], spaces: [], folders: [] })
      return []
    }
  },

  fetchProjectsByFolder: async ({ workspaceId, folderId, force = false }) => {
    if (!workspaceId || !folderId) return []

    const { folderProjects, folderProjectsLoading } = get()
    if (!force && Array.isArray(folderProjects[folderId])) {
      return folderProjects[folderId]
    }

    if (folderProjectsLoading[folderId]) {
      return folderProjects[folderId] || []
    }

    set((state) => ({
      folderProjectsLoading: { ...state.folderProjectsLoading, [folderId]: true },
    }))

    try {
      const { data } = await projectsAPI.listByFolder({ workspace: workspaceId, folder: folderId })
      const fetchedProjects = data?.results || data || []

      set((state) => ({
        folderProjects: { ...state.folderProjects, [folderId]: fetchedProjects },
        // Update projectMap with newly fetched projects
        projectMap: {
          ...state.projectMap,
          ...fetchedProjects.reduce((acc, p) => ({ ...acc, [p.id]: p }), {})
        }
      }))

      return fetchedProjects
    } catch (error) {
      throw error
    } finally {
      set((state) => ({
        folderProjectsLoading: { ...state.folderProjectsLoading, [folderId]: false },
      }))
    }
  },

  createSpace: async (spaceData) => {
    set({ isSubmitting: true })
    try {
      const { data } = await projectsAPI.createSpace(spaceData)
      set((state) => ({ 
        spaces: [data, ...state.spaces], 
        spaceMap: { ...state.spaceMap, [data.id]: data },
        isSubmitting: false 
      }))
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
      set((state) => ({ 
        folders: [data, ...state.folders], 
        folderMap: { ...state.folderMap, [data.id]: data },
        isSubmitting: false 
      }))
      return data
    } catch (err) {
      set({ isSubmitting: false })
      throw err
    }
  },

  setActiveProject: (project) => set({ activeProject: project }),

  fetchProjectById: async (projectId) => {
    const { projectMap, activeProject, notFoundProjectIds } = get()

    if (notFoundProjectIds[projectId]) {
      const error = new Error('Project not found')
      error.response = { status: 404 }
      throw error
    }

    if (activeProject?.id === projectId) return activeProject
    
    // O(1) lookup
    const existing = projectMap[projectId]
    if (existing) {
      set({ activeProject: existing })
      return existing
    }

    try {
      const { data } = await projectsAPI.get(projectId)
      set((state) => {
        const nextMap = { ...state.projectMap, [projectId]: data }
        if (!state.notFoundProjectIds[projectId]) {
          return { activeProject: data, projectMap: nextMap }
        }
        const nextNotFound = { ...state.notFoundProjectIds }
        delete nextNotFound[projectId]
        return { activeProject: data, projectMap: nextMap, notFoundProjectIds: nextNotFound }
      })
      return data
    } catch (err) {
      if (err?.response?.status === 404) {
        set((state) => ({
          notFoundProjectIds: { ...state.notFoundProjectIds, [projectId]: true },
        }))
      }
      throw err
    }
  },

  getProjectById: (projectId) => {
    const { projectMap, activeProject } = get()
    return activeProject?.id === projectId ? activeProject : projectMap[projectId]
  },

  fetchProjectMembers: async (projectId) => {
    try {
      const { data } = await projectsAPI.listMembers(projectId)
      const membersList = data.results || data
      set({ projectMembers: membersList })
      return membersList
    } catch {
      return []
    }
  },

  addProjectMember: async (projectId, memberData) => {
    const { data } = await projectsAPI.addMember(projectId, memberData)
    set((state) => ({ projectMembers: [...state.projectMembers, data] }))
    return data
  },

  removeProjectMember: async (projectId, userId) => {
    await projectsAPI.removeMember(projectId, userId)
    set((state) => ({ 
      projectMembers: state.projectMembers.filter((m) => m.user.id !== userId)
    }))
  },

  clear: () => set({
    projects: [],
    projectMap: {},
    spaces: [],
    spaceMap: {},
    folders: [],
    folderMap: {},
    hierarchy: [],
    folderProjects: {},
    folderProjectsLoading: {},
    activeProject: null,
    notFoundProjectIds: {},
    loading: false,
    isSubmitting: false,
  }),
}))
