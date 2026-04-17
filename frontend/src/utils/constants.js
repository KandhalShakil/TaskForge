export const TASK_STATUSES = [
  { value: 'todo', label: 'To Do', color: 'status-todo' },
  { value: 'in_progress', label: 'In Progress', color: 'status-in_progress' },
  { value: 'in_review', label: 'In Review', color: 'status-in_review' },
  { value: 'done', label: 'Done', color: 'status-done' },
  { value: 'cancelled', label: 'Cancelled', color: 'status-cancelled' },
]

export const TASK_PRIORITIES = [
  { value: 'urgent', label: 'Urgent', color: 'priority-urgent', icon: '🔴' },
  { value: 'high', label: 'High', color: 'priority-high', icon: '🟠' },
  { value: 'medium', label: 'Medium', color: 'priority-medium', icon: '🟡' },
  { value: 'low', label: 'Low', color: 'priority-low', icon: '🔵' },
  { value: 'no_priority', label: 'No Priority', color: 'priority-no_priority', icon: '⚪' },
]

export const KANBAN_COLUMNS = [
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'in_review', label: 'In Review' },
  { id: 'done', label: 'Done' },
  { id: 'cancelled', label: 'Cancelled' },
]

export const WORKSPACE_ICONS = ['🚀', '⚡', '🔥', '💡', '🎯', '🌟', '💎', '🎨', '🔬', '📊']
export const WORKSPACE_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'
]
