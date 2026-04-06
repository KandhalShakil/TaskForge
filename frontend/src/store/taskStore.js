import { create } from 'zustand'
import { tasksAPI, categoriesAPI } from '../api/tasks'

export const useTaskStore = create((set, get) => ({
  tasks: [],
  categories: [],
  stats: null,
  loading: false,
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
    const { data } = await tasksAPI.create(taskData)
    set((state) => ({ tasks: [data, ...state.tasks] }))
    return data
  },

  updateTask: async (id, taskData) => {
    const { data } = await tasksAPI.update(id, taskData)
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? data : t)),
    }))
    return data
  },

  deleteTask: async (id) => {
    await tasksAPI.delete(id)
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }))
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
    const { data } = await tasksAPI.stats(params)
    set({ stats: data })
    return data
  },

  fetchCategories: async (workspaceId) => {
    const { data } = await categoriesAPI.list({ workspace: workspaceId })
    const categoriesList = data.results || data
    set({ categories: categoriesList })
    return categoriesList
  },

  createCategory: async (categoryData) => {
    const { data } = await categoriesAPI.create(categoryData)
    set((state) => ({ categories: [...state.categories, data] }))
    return data
  },
}))
