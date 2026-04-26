import { create } from 'zustand'
import { tasksAPI, categoriesAPI } from '../api/tasks'

export const useTaskStore = create((set, get) => ({
  tasks: [],
  categories: [],
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
      const tasks = data.results || data
      set({ tasks, loading: false })
      return tasks
    } catch (err) {
      set({ loading: false })
      return []
    }
  },

  createTask: async (taskData) => {
    set({ isSubmitting: true })
    try {
      const { data } = await tasksAPI.create(taskData)
      set((state) => ({ tasks: [data, ...state.tasks], isSubmitting: false }))
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
        isSubmitting: false,
      }))
      return data
    } catch (err) {
      set({ isSubmitting: false })
      throw err
    }
  },

  deleteTask: async (id) => {
    set({ isSubmitting: true })
    try {
      await tasksAPI.delete(id)
      set((state) => ({ 
        tasks: state.tasks.filter((t) => t.id !== id),
        isSubmitting: false
      }))
    } catch (err) {
      set({ isSubmitting: false })
      throw err
    }
  },

  bulkUpdateTasks: async (updates) => {
    const { data } = await tasksAPI.bulkUpdate(updates)
    set((state) => {
      const updatedMap = {}
      data.forEach((t) => { updatedMap[t.id] = t })
      return {
        tasks: state.tasks.map((t) => updatedMap[t.id] || t),
      }
    })
  },

  fetchStats: async (params) => {
    set({ statsLoading: true, statsError: null })
    try {
      const { data } = await tasksAPI.stats(params)
      set({ stats: data, statsLoading: false })
      return data
    } catch (err) {
      const message =
        err?.response?.data?.error || err?.message || 'Failed to load analytics data.'
      set({ statsError: message, statsLoading: false })
      throw err
    }
  },

  fetchCategories: async (workspaceId) => {
    const { data } = await categoriesAPI.list({ workspace: workspaceId })
    const categoriesList = data.results || data
    set({ categories: categoriesList })
    return categoriesList
  },

  createCategory: async (categoryData) => {
    set({ isSubmitting: true })
    try {
      const { data } = await categoriesAPI.create(categoryData)
      set((state) => ({ categories: [...state.categories, data], isSubmitting: false }))
      return data
    } catch (err) {
      set({ isSubmitting: false })
      throw err
    }
  },

  clear: () => set({
    tasks: [],
    categories: [],
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
  }),
}))
