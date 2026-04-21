const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const FIELD_LABELS = {
  name: 'Title',
  title: 'Title',
  description: 'Description',
  start_date: 'Start date',
  end_date: 'End date',
  due_date: 'End date',
  priority: 'Priority',
  assignee_id: 'Assignee',
  category_id: 'Category',
  estimated_hours: 'Estimated hours',
  email: 'Email',
}

const isEmpty = (value) => value === null || value === undefined || String(value).trim() === ''

const toLocalDate = (value) => {
  if (!value || !DATE_RE.test(String(value))) return null
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

const toDate = (value) => {
  return toLocalDate(value)
}

const addRequiredErrors = (data, requiredFields, errors) => {
  requiredFields.forEach((field) => {
    if (isEmpty(data[field])) {
      const label = FIELD_LABELS[field] || field
      errors[field] = `${label} is required`
    }
  })
}

export const calculateTaskHoursLimit = (data, referenceDate = new Date()) => {
  const start = toLocalDate(data.start_date)
  const end = toLocalDate(data.due_date || data.end_date)

  if (!start || !end) {
    return { limitHours: null, isSameDay: false, remainingHours: null, isValidTimeSelection: true }
  }

  const startDay = start.toDateString()
  const endDay = end.toDateString()

  if (startDay === endDay) {
    const now = referenceDate instanceof Date ? referenceDate : new Date(referenceDate)
    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)
    const remainingMs = endOfDay.getTime() - now.getTime()
    const remainingHours = Math.max(remainingMs / 3600000, 0)
    return {
      limitHours: remainingHours,
      isSameDay: true,
      remainingHours,
      displayHours: Number(remainingHours.toFixed(2)),
      isValidTimeSelection: remainingHours > 0,
    }
  }

  const durationDays = Math.max(Math.floor((end.getTime() - start.getTime()) / 86400000) + 1, 0)
  return {
    limitHours: durationDays * 24,
    isSameDay: false,
    remainingHours: null,
    displayHours: durationDays * 24,
    isValidTimeSelection: true,
  }
}

const addCommonDateAndHoursErrors = (data, errors, referenceDate = new Date()) => {
  const start = toDate(data.start_date)
  const end = toDate(data.due_date || data.end_date)

  if (data.start_date && !start) {
    errors.start_date = 'Date format is invalid'
  }

  const endField = data.due_date !== undefined ? 'due_date' : 'end_date'
  if ((data.due_date || data.end_date) && !end) {
    errors[endField] = 'Date format is invalid'
  }

  if (start && end && end < start) {
    errors[endField] = 'End date cannot be before start date'
  }

  const hours = Number(data.estimated_hours)
  if (data.estimated_hours !== undefined && data.estimated_hours !== '' && !Number.isFinite(hours)) {
    errors.estimated_hours = 'Estimated hours must be a positive number'
  }

  if (Number.isFinite(hours) && hours <= 0) {
    errors.estimated_hours = 'Estimated hours must be a positive number'
  }

  const { limitHours, isSameDay, isValidTimeSelection } = calculateTaskHoursLimit(data, referenceDate)
  if (Number.isFinite(hours) && limitHours !== null) {
    if (!isValidTimeSelection && isSameDay) {
      errors.estimated_hours = 'Invalid time selection'
    } else if (hours > limitHours) {
      errors.estimated_hours = isSameDay
        ? 'Estimated hours cannot exceed remaining time today'
        : 'Estimated hours cannot exceed task duration'
    }
  }

  return { start, end }
}

export const validateProject = (data, referenceDate = new Date()) => {
  const errors = {}
  addRequiredErrors(data, ['name', 'description', 'start_date', 'end_date'], errors)

  const { start, end } = addCommonDateAndHoursErrors(
    { ...data, due_date: undefined, estimated_hours: undefined },
    errors,
    referenceDate
  )

  if (start && end && end < start) {
    errors.end_date = 'End date cannot be before start date'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    generalError: Object.keys(errors).length ? 'All fields are required' : '',
  }
}

export const validateTask = (data, { project, referenceDate = new Date() } = {}) => {
  const errors = {}
  addRequiredErrors(
    data,
    ['title', 'description', 'start_date', 'due_date', 'priority', 'assignee_id', 'category_id', 'estimated_hours'],
    errors
  )

  const { start, end } = addCommonDateAndHoursErrors(data, errors, referenceDate)

  if (project?.start_date && project?.end_date && start && end) {
    const projectStart = new Date(project.start_date)
    const projectEnd = new Date(project.end_date)
    if (start < projectStart || end > projectEnd) {
      errors.start_date = 'Task date must be within project date range'
      errors.due_date = 'Task date must be within project date range'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    generalError: Object.keys(errors).length ? 'All fields are required' : '',
  }
}

export const validateSubtask = (data, { parent, referenceDate = new Date() } = {}) => {
  const result = validateTask(data, { project: null, referenceDate })

  if (!result.isValid) {
    return result
  }

  const start = toDate(data.start_date)
  const end = toDate(data.due_date)

  if (parent?.start_date && parent?.due_date && start && end) {
    const parentStart = new Date(parent.start_date)
    const parentEnd = new Date(parent.due_date)
    if (start < parentStart || end > parentEnd) {
      result.errors.start_date = 'Subtask must be within parent task date range'
      result.errors.due_date = 'Subtask must be within parent task date range'
      result.isValid = false
      result.generalError = 'All fields are required'
    }
  }

  return result
}

export const extractApiError = (error, fallback = 'Something went wrong') => {
  const data = error?.response?.data
  if (!data) return fallback

  if (typeof data.error === 'string' && data.error.trim()) {
    return data.error
  }

  const firstValue = Object.values(data)[0]
  if (Array.isArray(firstValue) && firstValue[0]) return String(firstValue[0])
  if (typeof firstValue === 'string') return firstValue

  return fallback
}

export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim())
