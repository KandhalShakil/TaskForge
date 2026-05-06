import { create } from 'zustand'
import { tasksAPI, categoriesAPI } from '../api/tasks'
import { connectSocket } from '../utils/socket'

export const useTaskStore = create((set, get) => ({
  tasks: [],
  taskMap: {}, // O(1) lookup
  categories: [],
  categoryMap: {}, // O(1) lookup
  stats: null,
  statsLoading: false,
  statsError: null,
  loading: false,
  isSubmitting: false,
  filters: {
    status: '',
    priority: '',
    assignee: '',
    category: '',
    search: '',
    due_date_from: '',
    due_date_to: '',
  },

  setFilters: (newFilters) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),

  clearFilters: () =>
    set({
      filters: {
        status: '',
        priority: '',
        assignee: '',
        category: '',
        search: '',
        due_date_from: '',
        due_date_to: '',
      },
    }),

  fetchTasks: async (params) => {
    set({ loading: true })
    try {
      const filters = get().filters
      const queryParams = {
        ...params,
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.assignee && { assignee: filters.assignee }),
        ...(filters.category && { category: filters.category }),
        ...(filters.search && { search: filters.search }),
        ...(filters.due_date_from && { due_date_from: filters.due_date_from }),
        ...(filters.due_date_to && { due_date_to: filters.due_date_to }),
      }
      const { data } = await tasksAPI.list(queryParams)
      const tasksList = data.results || data
      const tMap = tasksList.reduce((acc, t) => ({ ...acc, [t.id]: t }), {})
      set({ tasks: tasksList, taskMap: tMap, loading: false })
      return tasksList
    } catch (err) {
      set({ loading: false })
      return []
    }
  },

  createTask: async (taskData) => {
    set({ isSubmitting: true })
    try {
      const { data } = await tasksAPI.create(taskData)
      set((state) => ({ 
        tasks: [data, ...state.tasks], 
        taskMap: { ...state.taskMap, [data.id]: data },
        isSubmitting: false 
      }))
      
      const socket = connectSocket()
      socket.emit('task_updated', {
        projectId: data.projectId,
        task: data,
        action: 'create'
      })
      
      return data
    } catch (err) {
      set({ isSubmitting: false })
      throw err
    }
  },

  updateTask: async (id, taskData) => {
    set({ isSubmitting: true })
    try {
      const { data } = await tasksAPI.update(id, taskData)
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? data : t)),
        taskMap: { ...state.taskMap, [id]: data },
        isSubmitting: false,
      }))

      const socket = connectSocket()
      socket.emit('task_updated', {
        projectId: data.projectId,
        task: data,
        action: 'update'
      })

      return data
    } catch (err) {
      set({ isSubmitting: false })
      throw err
    }
  },

  deleteTask: async (id) => {
    set({ isSubmitting: true })
    try {
      const taskToDelete = get().taskMap[id] || get().tasks.find(t => t.id === id)
      await tasksAPI.delete(id)
      set((state) => {
        const nextMap = { ...state.taskMap }
        delete nextMap[id]
        return { 
          tasks: state.tasks.filter((t) => t.id !== id),
          taskMap: nextMap,
          isSubmitting: false
        }
      })

      if (taskToDelete) {
        const socket = connectSocket()
        socket.emit('task_updated', {
          projectId: taskToDelete.projectId,
          task: { id },
          action: 'delete'
        })
      }
    } catch (err) {
      set({ isSubmitting: false })
      throw err
    }
  },

  bulkUpdateTasks: async (updates) => {
    const { data } = await tasksAPI.bulkUpdate(updates)
    set((state) => {
      const nextMap = { ...state.taskMap }
      data.forEach((t) => { nextMap[t.id] = t })
      return {
        tasks: state.tasks.map((t) => nextMap[t.id] || t),
        taskMap: nextMap
      }
    })

    if (data.length > 0) {
      const socket = connectSocket()
      socket.emit('task_updated', {
        projectId: data[0].projectId,
        tasks: data,
        action: 'bulk_update'
      })
    }
  },

  fetchStats: async (params) => {
    const cacheKey = JSON.stringify(params)
    const now = Date.now()
    if (get()._statsCache?.[cacheKey] && now - get()._statsCache[cacheKey].timestamp < 60000) {
      const cachedData = get()._statsCache[cacheKey].data
      set({ stats: cachedData, statsLoading: false })
      return cachedData
    }

    set({ statsLoading: true, statsError: null })
    try {
      const { data } = await tasksAPI.stats(params)
      set((state) => ({
        stats: data,
        statsLoading: false,
        _statsCache: {
          ...state._statsCache,
          [cacheKey]: { data, timestamp: now }
        }
      }))
      return data
    } catch (err) {
      const message = err?.response?.data?.error || err?.message || 'Failed to load analytics data.'
      set({ statsError: message, statsLoading: false })
      throw err
    }
  },

  fetchCategories: async (workspaceId) => {
    const { data } = await categoriesAPI.list({ workspace: workspaceId })
    const categoriesList = data.results || data
    const cMap = categoriesList.reduce((acc, c) => ({ ...acc, [c.id]: c }), {})
    set({ categories: categoriesList, categoryMap: cMap })
    return categoriesList
  },

  createCategory: async (categoryData) => {
    set({ isSubmitting: true })
    try {
      const { data } = await categoriesAPI.create(categoryData)
      set((state) => ({ 
        categories: [...state.categories, data], 
        categoryMap: { ...state.categoryMap, [data.id]: data },
        isSubmitting: false 
      }))
      return data
    } catch (err) {
      set({ isSubmitting: false })
      throw err
    }
  },

  clearStatsCache: () => set({ _statsCache: {} }),

  clear: () => set({
    tasks: [],
    taskMap: {},
    categories: [],
    categoryMap: {},
    stats: null,
    statsLoading: false,
    statsError: null,
    loading: false,
    isSubmitting: false,
    _statsCache: {},
    filters: {
      status: '',
      priority: '',
      assignee: '',
      category: '',
      search: '',
      due_date_from: '',
      due_date_to: '',
    },
  }),
}))
