import { format, parseISO } from 'date-fns'

export const buildWorkspaceRoom = (workspaceId) => `workspace_${workspaceId}`
export const buildTaskRoom = (taskId) => `task_${taskId}`

export const buildDirectRoom = (userAId, userBId) => {
  const [first, second] = [String(userAId), String(userBId)].sort()
  return `dm_${first}_${second}`
}

export const getPusherConfig = () => {
  return {
    key: import.meta.env.VITE_PUSHER_KEY || '',
    cluster: import.meta.env.VITE_PUSHER_CLUSTER || '',
  }
}

export const formatChatTimestamp = (value) => {
  if (!value) return ''
  const date = typeof value === 'string' ? parseISO(value) : value
  if (Number.isNaN(date?.getTime?.())) return ''
  return format(date, 'p')
}

export const formatChatPreviewTime = (value) => {
  if (!value) return ''
  const date = typeof value === 'string' ? parseISO(value) : value
  if (Number.isNaN(date?.getTime?.())) return ''
  return format(date, 'MMM d, p')
}
