import { format, formatDistanceToNow, isToday, isTomorrow, isPast, parseISO, isValid } from 'date-fns'

export const formatDate = (date, fmt = 'MMM d, yyyy') => {
  if (!date) return null
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return null
  return format(d, fmt)
}

export const formatRelative = (date) => {
  if (!date) return null
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return null
  return formatDistanceToNow(d, { addSuffix: true })
}

export const formatDueDate = (dateStr) => {
  if (!dateStr) return null
  const d = parseISO(dateStr)
  if (!isValid(d)) return null

  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  if (isPast(d)) return `${format(d, 'MMM d')} (overdue)`
  return format(d, 'MMM d')
}

export const isOverdue = (dateStr, status) => {
  if (!dateStr || ['done', 'cancelled'].includes(status)) return false
  const d = parseISO(dateStr)
  return isValid(d) && isPast(d) && !isToday(d)
}

export const toISODateString = (date) => {
  if (!date) return null
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'yyyy-MM-dd')
}
