import { useEffect, useMemo, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { X, Calendar, User, Tag, Flag, AlignLeft, Trash2, Plus, CheckSquare, Square, XCircle, Edit2, ChevronDown, ChevronRight, Hash, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTaskStore } from '../../store/taskStore'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { TASK_STATUSES, TASK_PRIORITIES } from '../../utils/constants'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { useAuthStore } from '../../store/authStore'
import ConfirmModal from '../common/ConfirmModal'
import Button from '../common/Button'
import SelectionList from '../common/SelectionList'
import AdvancedDatePicker from '../common/AdvancedDatePicker'
import SegmentedControl from '../common/SegmentedControl'
import SubtaskModal from './SubtaskModal'
import CreateCategoryModal from './CreateCategoryModal'
import { tasksAPI } from '../../api/tasks'
import { stripHtml } from '../../utils/html'
import { calculateTaskHoursLimit, extractApiError, validateTask } from '../../utils/validation'

const makeTempKey = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const flattenSubtasks = (items = [], parentId = null, bucket = []) => {
  items.forEach((item, index) => {
    const parentRef = item?.parent_id ?? item?.parent ?? parentId
    const normalizedParent = typeof parentRef === 'string' ? parentRef : null
    const tempKey = makeTempKey()
    const flatNode = {
      id: item?.id || null,
      temp_key: tempKey,
      title: item?.title || '',
      description: item?.description || '',
      status: item?.status || 'todo',
      priority: item?.priority || 'no_priority',
      assignee_id: item?.assignee?.id || item?.assignee_id || '',
      category_id: item?.category?.id || item?.category_id || '',
      start_date: item?.start_date || '',
      due_date: item?.due_date || '',
      estimated_hours: item?.estimated_hours || '',
      is_completed: Boolean(item?.is_completed),
      order: typeof item?.order === 'number' ? item.order : index,
      parent_id: normalizedParent,
      parent_temp_key: null,
    }
    bucket.push(flatNode)

    if (Array.isArray(item?.children) && item.children.length > 0) {
      flattenSubtasks(item.children, item?.id || tempKey, bucket)
    }
  })
  return bucket
}

const hydrateParentTempKeys = (items) => {
  const idToTempKey = new Map(items.filter((item) => item.id).map((item) => [item.id, item.temp_key]))
  return items.map((item) => {
    const parentTemp = item.parent_id ? idToTempKey.get(item.parent_id) || null : null
    return {
      ...item,
      parent_temp_key: parentTemp,
    }
  })
}

const createEmptySubtask = (parentKey = null) => ({
  id: null,
  temp_key: makeTempKey(),
  title: '',
  description: '',
  status: 'todo',
  priority: 'no_priority',
  assignee_id: '',
  category_id: '',
  start_date: '',
  due_date: '',
  estimated_hours: '',
  is_completed: false,
  order: 0,
  parent_id: null,
  parent_temp_key: parentKey,
})

const buildChildrenMap = (items) => {
  const map = new Map()
  items.forEach((item) => {
    const parentKey = item.parent_id || item.parent_temp_key || null
    if (!map.has(parentKey)) {
      map.set(parentKey, [])
    }
    map.get(parentKey).push(item)
  })
  return map
}

const collectBranchKeys = (node, childrenMap, bucket = new Set()) => {
  const key = node.id || node.temp_key
  bucket.add(key)
  const children = childrenMap.get(key) || []
  children.forEach((child) => collectBranchKeys(child, childrenMap, bucket))
  return bucket
}

const normalizeSubtasksForSave = (items) => {
  const cleaned = items
    .map((item) => ({
      ...item,
      title: (item.title || '').trim(),
      description: stripHtml(item.description),
      assignee_id: item.assignee_id || null,
      category_id: item.category_id || null,
      start_date: item.start_date || null,
      due_date: item.due_date || null,
      estimated_hours: item.estimated_hours === '' ? null : item.estimated_hours,
      source_key: item.id || item.temp_key,
    }))
    .filter((item) => item.title.length > 0)

  const validKeys = new Set(cleaned.map((item) => item.source_key))
  const siblingOrder = new Map()

  return cleaned.map((item) => {
    const tentativeParent = item.parent_id || item.parent_temp_key || null
    const parentKey = tentativeParent && validKeys.has(tentativeParent) ? tentativeParent : null
    const currentOrder = siblingOrder.get(parentKey) || 0
    siblingOrder.set(parentKey, currentOrder + 1)

    return {
      id: item.id,
      source_key: item.source_key,
      title: item.title,
      description: item.description,
      status: item.status || 'todo',
      priority: item.priority || 'no_priority',
      assignee_id: item.assignee_id,
      category_id: item.category_id,
      start_date: item.start_date,
      due_date: item.due_date,
      estimated_hours: item.estimated_hours,
      is_completed: Boolean(item.is_completed),
      order: currentOrder,
      parent_key: parentKey,
    }
  })
}

const toNestedSubtasksInput = (prepared) => {
  const childrenMap = new Map()

  prepared.forEach((item) => {
    const parentKey = item.parent_key || null
    if (!childrenMap.has(parentKey)) {
      childrenMap.set(parentKey, [])
    }
    childrenMap.get(parentKey).push(item)
  })

  const buildNode = (node) => ({
    title: node.title,
    description: node.description,
    status: node.status,
    priority: node.priority,
    assignee_id: node.assignee_id,
    category_id: node.category_id,
    start_date: node.start_date,
    due_date: node.due_date,
    estimated_hours: node.estimated_hours,
    is_completed: node.is_completed,
    order: node.order,
    children: (childrenMap.get(node.source_key) || []).map(buildNode),
  })

  return (childrenMap.get(null) || []).map(buildNode)
}

export default function TaskModal({ task, project, workspace, onClose }) {
  const { createTask, updateTask, deleteTask, categories } = useTaskStore()
  const { members, getUserRole } = useWorkspaceStore()
  const { user } = useAuthStore()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoadingSubtasks, setIsLoadingSubtasks] = useState(false)
  const [isSavingSubtasks, setIsSavingSubtasks] = useState(false)
  const [formError, setFormError] = useState('')
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [subtaskEditor, setSubtaskEditor] = useState({ isOpen: false, subtask: null, parent: null })
  const [expandedSubtasks, setExpandedSubtasks] = useState({})
  const [now, setNow] = useState(() => new Date())
  const isEditing = !!task

  const [subtasks, setSubtasks] = useState([])
  const [initialSubtaskIds, setInitialSubtaskIds] = useState([])

  const userRole = getUserRole(user?.id)
  const isViewer = userRole === 'viewer'
  const isAdmin = userRole === 'admin'

  const canEdit = useMemo(() => {
    if (isViewer) return false
    if (isAdmin) return true
    if (!isEditing) return true // Members can create
    return task?.created_by?.id === user?.id || task?.assignee?.id === user?.id
  }, [isAdmin, isViewer, isEditing, task, user?.id])

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    setError,
    setFocus,
    clearErrors,
    formState: { errors, isSubmitting, isValid },
  } = useForm({
    mode: 'onChange',
    defaultValues: task ? {
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignee_id: task.assignee?.id || '',
      category_id: task.category?.id || '',
      due_date: task.due_date || '',
      start_date: task.start_date || '',
      estimated_hours: task.estimated_hours || '',
    } : {
      status: 'todo',
      priority: 'no_priority',
    }
  })

  const startDate = watch('start_date')
  const dueDate = watch('due_date')
  const estimatedHours = watch('estimated_hours')

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const taskHoursLimit = useMemo(() => {
    return calculateTaskHoursLimit({ start_date: startDate, due_date: dueDate }, now)
  }, [startDate, dueDate, now])

  const estimatedHoursValidationMessage = useMemo(() => {
    if (!taskHoursLimit.limitHours && taskHoursLimit.isSameDay && !taskHoursLimit.isValidTimeSelection) {
      return 'Invalid time selection'
    }

    if (taskHoursLimit.limitHours === null) return ''

    const parsed = Number(estimatedHours)
    if (!Number.isFinite(parsed) || parsed <= 0) return ''

    if (parsed > taskHoursLimit.limitHours) {
      return taskHoursLimit.isSameDay
        ? 'Estimated hours cannot exceed remaining time today'
        : 'Estimated hours cannot exceed task duration'
    }

    return ''
  }, [estimatedHours, taskHoursLimit])

  useEffect(() => {
    let active = true

    const normalizeSubtasks = (items = []) => {
      if (!items.length) return []

      const flattened = flattenSubtasks(items)
      const normalized = hydrateParentTempKeys(flattened)
      return normalized.length ? normalized : []
    }

    const loadSubtasks = async () => {
      if (!isEditing) {
        if (active) {
          setSubtasks([])
          setInitialSubtaskIds([])
        }
        return
      }

      const inlineSubtasks = Array.isArray(task?.subtasks) ? task.subtasks : []
      if (inlineSubtasks.length > 0) {
        if (active) {
          const normalized = normalizeSubtasks(inlineSubtasks)
          setSubtasks(normalized)
          setInitialSubtaskIds(normalized.filter((item) => item.id).map((item) => item.id))
        }
        return
      }

      setIsLoadingSubtasks(true)
      try {
        const { data } = await tasksAPI.listSubtasks(task.id)
        if (!active) return
        const fetched = data?.results || data || []
        const normalized = normalizeSubtasks(fetched)
        setSubtasks(normalized)
        setInitialSubtaskIds(normalized.filter((item) => item.id).map((item) => item.id))
      } catch {
        if (active) {
          setSubtasks([])
          setInitialSubtaskIds([])
          toast.error('Failed to load subtasks')
        }
      } finally {
        if (active) {
          setIsLoadingSubtasks(false)
        }
      }
    }

    loadSubtasks()

    return () => {
      active = false
    }
  }, [isEditing, task])

  useEffect(() => {
    const withChildren = new Set()
    subtasks.forEach((item) => {
      const parentKey = item.parent_id || item.parent_temp_key || null
      if (parentKey) {
        withChildren.add(parentKey)
      }
    })

    setExpandedSubtasks((prev) => {
      const next = { ...prev }
      withChildren.forEach((key) => {
        if (next[key] === undefined) {
          next[key] = true
        }
      })
      return next
    })
  }, [subtasks])

  const nestedSubtasks = useMemo(() => {
    const byParent = buildChildrenMap(subtasks)
    return {
      roots: byParent.get(null) || [],
      byParent,
    }
  }, [subtasks])

  const openSubtaskEditor = (parentNode = null, subtask = null) => {
    setSubtaskEditor({
      isOpen: true,
      parent: parentNode,
      subtask,
    })
  }

  const closeSubtaskEditor = () => {
    setSubtaskEditor({ isOpen: false, subtask: null, parent: null })
  }

  const saveSubtaskEditor = (subtaskData) => {
    const parentKey = subtaskEditor.parent ? (subtaskEditor.parent.id || subtaskEditor.parent.temp_key) : null

    setSubtasks((prev) => {
      if (subtaskEditor.subtask) {
        return prev.map((item) => {
          const key = item.id || item.temp_key
          const editingKey = subtaskEditor.subtask.id || subtaskEditor.subtask.temp_key
          if (key !== editingKey) {
            return item
          }
          return {
            ...item,
            ...subtaskData,
            parent_id: subtaskData.parent_id ?? item.parent_id,
            parent_temp_key: item.parent_temp_key,
            temp_key: item.temp_key,
          }
        })
      }

      return [
        ...prev,
        {
          ...createEmptySubtask(parentKey),
          ...subtaskData,
          parent_id: null,
          parent_temp_key: parentKey,
        },
      ]
    })

    closeSubtaskEditor()
  }

  const removeSubtaskRow = (node) => {
    setSubtasks((prev) => {
      const childrenMap = buildChildrenMap(prev)
      const branchKeys = collectBranchKeys(node, childrenMap)
      const remaining = prev.filter((item) => !branchKeys.has(item.id || item.temp_key))
      return remaining
    })
  }

  const toggleSubtaskExpanded = (nodeKey) => {
    setExpandedSubtasks((prev) => ({
      ...prev,
      [nodeKey]: !(prev[nodeKey] ?? true),
    }))
  }

  const toggleSubtaskComplete = (nodeKey) => {
    setSubtasks((prev) => {
      return prev.map((item) => {
        const key = item.id || item.temp_key
        if (key !== nodeKey) {
          return item
        }
        return {
          ...item,
          is_completed: !item.is_completed,
        }
      })
    })
  }

  const persistNewSubtasks = async (taskId, preparedSubtasks) => {
    const childrenMap = new Map()
    const preparedKeys = new Set(preparedSubtasks.map((item) => item.source_key))

    preparedSubtasks.forEach((item) => {
      const parentKey = item.parent_key || null
      if (!childrenMap.has(parentKey)) {
        childrenMap.set(parentKey, [])
      }
      childrenMap.get(parentKey).push(item)
    })

    const createBranch = async (parentKey = null, parentId = null) => {
      const children = childrenMap.get(parentKey) || []

      for (const child of children) {
        const { data } = await tasksAPI.addSubtask(taskId, {
          task: taskId,
          title: child.title,
          description: stripHtml(child.description),
          status: child.status,
          priority: child.priority,
          assignee_id: child.assignee_id,
          category_id: child.category_id,
          start_date: child.start_date,
          due_date: child.due_date,
          estimated_hours: child.estimated_hours,
          is_completed: child.is_completed,
          order: child.order,
          parent_id: parentId,
        })

        await createBranch(child.source_key, data.id)
      }
    }

    const entryPoints = []
    childrenMap.forEach((children, parentKey) => {
      if (parentKey === null || !preparedKeys.has(parentKey)) {
        entryPoints.push({ parentKey, parentId: parentKey })
      }
    })

    for (const entry of entryPoints) {
      await createBranch(entry.parentKey, entry.parentId)
    }
  }

  const onSubmit = async (data) => {
    try {
      setFormError('')
      clearErrors()

      const validation = validateTask(data, { project, referenceDate: now })
      if (!validation.isValid) {
        setFormError(validation.generalError || 'All fields are required')
        Object.entries(validation.errors).forEach(([field, message]) => {
          setError(field, { type: 'manual', message })
        })
        const firstField = Object.keys(validation.errors)[0]
        if (firstField) setFocus(firstField)
        return
      }

      const cleanedSubtasks = normalizeSubtasksForSave(subtasks)

      const payload = {
        ...data,
        workspace: workspace.id,
        project: project?.id || null,
        title: (data.title || '').trim(),
        description: stripHtml(data.description),
        assignee_id: data.assignee_id || null,
        category_id: data.category_id || null,
        estimated_hours: data.estimated_hours || null,
        ...(isEditing
          ? {}
          : {
              subtasks_input: toNestedSubtasksInput(cleanedSubtasks),
            }),
      }

      if (isEditing) {
        await updateTask(task.id, payload)
        setIsSavingSubtasks(true)
        const existing = cleanedSubtasks.filter((subtask) => Boolean(subtask.id))
        const incomingIds = new Set(existing.map((subtask) => subtask.id))
        const removedIds = initialSubtaskIds.filter((id) => !incomingIds.has(id))
        const newlyAdded = cleanedSubtasks.filter((subtask) => !subtask.id)

        await Promise.all([
          ...existing.map((subtask) =>
            tasksAPI.updateSubtask(subtask.id, {
              title: subtask.title,
              description: stripHtml(subtask.description),
              status: subtask.status,
              priority: subtask.priority,
              assignee_id: subtask.assignee_id,
              category_id: subtask.category_id,
              start_date: subtask.start_date,
              due_date: subtask.due_date,
              estimated_hours: subtask.estimated_hours,
              is_completed: subtask.is_completed,
              order: subtask.order,
              parent_id: subtask.parent_key,
            })
          ),
          ...removedIds.map((id) => tasksAPI.deleteSubtask(id)),
        ])

        if (newlyAdded.length > 0) {
          await persistNewSubtasks(task.id, newlyAdded)
        }
        toast.success('Task updated!')
      } else {
        await createTask(payload)
        toast.success('Task created!')
      }
      onClose()
    } catch (err) {
      const message = extractApiError(err, 'Failed to save task')
      setFormError(message)
      toast.error(message)
    } finally {
      setIsSavingSubtasks(false)
    }
  }

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    setIsDeleting(true)
    try {
        await deleteTask(task.id)
      toast.success('Task deleted!')
      onClose()
    } catch (err) {
      toast.error('Failed to delete task')
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const getMemberName = (memberId) => {
    if (!memberId) return 'Unassigned'
    return members.find((member) => member.user.id === memberId)?.user.full_name || 'Unassigned'
  }

  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'No category'
    return categories.find((category) => category.id === categoryId)?.name || 'No category'
  }

  const renderSubtaskRows = (nodes, byParent, depth = 0, parentNode = null) => {
    return nodes.map((subtask, index) => {
      const nodeKey = subtask.id || subtask.temp_key
      const children = byParent.get(nodeKey) || []
      const hasChildren = children.length > 0
      const isExpanded = expandedSubtasks[nodeKey] ?? true
      const overdue = subtask.due_date && subtask.start_date && subtask.due_date < subtask.start_date
      const statusLabel = TASK_STATUSES.find((item) => item.value === subtask.status)?.label || subtask.status
      const priorityLabel = TASK_PRIORITIES.find((item) => item.value === subtask.priority)?.label || subtask.priority

      return (
        <div key={nodeKey} className="space-y-2">
          <div style={{ marginLeft: `${depth * 18}px` }}>
            <div 
              className={`rounded-xl border transition-colors`}
              style={{ 
                borderColor: subtask.is_completed ? 'var(--primary-main)' : 'var(--border-main)',
                backgroundColor: subtask.is_completed ? 'var(--primary-glow)' : 'var(--bg-page)'
              }}
            >
              <div className="flex items-start gap-3 px-3 py-2.5">
                <div className="pt-0.5">
                  {hasChildren ? (
                    <button
                      type="button"
                      className="btn-ghost p-1 text-slate-400 hover:text-slate-100"
                      onClick={() => toggleSubtaskExpanded(nodeKey)}
                      title={isExpanded ? 'Collapse subtasks' : 'Expand subtasks'}
                    >
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                  ) : (
                    <span className="inline-flex h-6 w-6 items-center justify-center text-slate-600">•</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span 
                      className={`badge text-[10px] px-2 py-0.5 border`}
                      style={{ 
                        backgroundColor: subtask.is_completed ? 'var(--primary-glow)' : 'var(--bg-page)',
                        color: subtask.is_completed ? 'var(--primary-main)' : 'var(--text-muted)',
                        borderColor: subtask.is_completed ? 'var(--primary-main)' : 'var(--border-main)'
                      }}
                    >
                      {subtask.is_completed ? 'Done' : 'Open'}
                    </span>
                    <span 
                      className={`text-sm font-medium truncate`}
                      style={{ 
                        color: subtask.is_completed ? 'var(--text-muted)' : 'var(--text-main)',
                        textDecoration: subtask.is_completed ? 'line-through' : 'none'
                      }}
                    >
                      {subtask.title || `Subtask ${index + 1}`}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    <span>Status: <span style={{ color: 'var(--text-main)' }}>{statusLabel}</span></span>
                    <span>Priority: <span style={{ color: 'var(--text-main)' }}>{priorityLabel}</span></span>
                    <span>Due: <span style={{ color: overdue ? '#ef4444' : 'var(--text-main)' }}>{subtask.due_date || 'Not set'}</span></span>
                    <span>Assignee: <span style={{ color: 'var(--text-main)' }}>{getMemberName(subtask.assignee_id)}</span></span>
                    <span>Category: <span style={{ color: 'var(--text-main)' }}>{getCategoryName(subtask.category_id)}</span></span>
                  </div>
                  {subtask.description && (
                    <p className="mt-2 text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>{subtask.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {hasChildren && (
                    <button
                      type="button"
                      className="btn-ghost px-2 py-1 text-[11px] text-slate-300"
                      onClick={() => toggleSubtaskExpanded(nodeKey)}
                      title={isExpanded ? 'Collapse subtasks' : 'Expand subtasks'}
                    >
                      {isExpanded ? 'Collapse' : 'Expand'}
                    </button>
                  )}
                  {!isViewer && (
                    <button
                      type="button"
                      className="btn-ghost p-1.5"
                      onClick={() => toggleSubtaskComplete(nodeKey)}
                      title={subtask.is_completed ? 'Mark as not completed' : 'Mark as completed'}
                    >
                      {subtask.is_completed ? <CheckSquare size={14} /> : <Square size={14} />}
                    </button>
                  )}
                  {!isViewer && (
                    <button
                      type="button"
                      className="btn-ghost p-1.5 text-slate-400 hover:text-slate-100"
                      onClick={() => openSubtaskEditor(parentNode, subtask)}
                      title="Edit subtask"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                  {!isViewer && (
                    <button
                      type="button"
                      className="btn-ghost p-1.5 text-slate-400 hover:text-slate-100"
                      onClick={() => openSubtaskEditor(subtask, null)}
                      title="Add child subtask"
                    >
                      <Plus size={14} />
                    </button>
                  )}
                  {!isViewer && (
                    <button
                      type="button"
                      className="btn-ghost p-1.5 text-red-400 hover:bg-red-950/30"
                      onClick={() => removeSubtaskRow(subtask)}
                      title="Delete subtask"
                    >
                      <XCircle size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {hasChildren && (
            <div className={`grid transition-all duration-200 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
              <div className="overflow-hidden">
                <div className="ml-4 border-l border-slate-800/80 pl-3 space-y-2">
                  {renderSubtaskRows(children, byParent, depth + 1, subtask)}
                </div>
              </div>
            </div>
          )}
        </div>
      )
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-main)' }}>
          <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
            {isEditing ? 'Edit Task' : 'Create Task'}
            {isViewer && <span className="badge text-[10px] uppercase tracking-wider px-2 py-0.5" style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-muted)' }}>Read Only</span>}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5" style={{ color: 'var(--text-muted)' }}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 no-scrollbar sm:custom-scrollbar">
          {formError && (
            <div className="rounded-lg border border-red-700/50 bg-red-950/40 px-3 py-2 text-xs text-red-200">
              {formError}
            </div>
          )}
          <div>
            <input
              className={`input text-base font-medium ${errors.title ? 'border-red-500' : ''}`}
              placeholder="Task title..."
              disabled={!canEdit}
              {...register('title', { required: 'Title is required' })}
            />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <AlignLeft size={14} style={{ color: 'var(--text-muted)' }} />
              <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Description</label>
            </div>
            <Controller
              name="description"
              control={control}
              rules={{ required: 'Description is required' }}
              render={({ field }) => (
                <div 
                  className={`border rounded-lg overflow-hidden [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-container]:border-none [&_.ql-editor]:min-h-[150px] [&_.ql-editor]:text-sm ${isViewer ? '[&_.ql-toolbar]:hidden' : ''}`}
                  style={{ 
                    backgroundColor: 'var(--bg-input)', 
                    borderColor: 'var(--border-main)' 
                  }}
                >
                  <ReactQuill theme="snow" value={field.value || ''} onChange={field.onChange} placeholder="Add a formatted description..." readOnly={!canEdit} />
                </div>
              )}
            />
            {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-6">
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <SegmentedControl
                  label="Execution Status"
                  options={TASK_STATUSES}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={!canEdit}
                />
              )}
            />

            <Controller
              name="priority"
              control={control}
              rules={{ required: 'Priority is required' }}
              render={({ field }) => (
                <SegmentedControl
                  label="Mission Priority"
                  options={TASK_PRIORITIES}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isViewer}
                  error={errors.priority?.message}
                />
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Controller
              name="assignee_id"
              control={control}
              rules={{ required: 'Assignee is required' }}
              render={({ field }) => (
                <SelectionList
                  label="Primary Operator"
                  options={members.map(m => ({ id: m.user.id, name: m.user.full_name, icon: <User size={14} /> }))}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.assignee_id?.message}
                  className="max-h-40"
                />
              )}
            />
            <div className="space-y-4">
              <Controller
                name="category_id"
                control={control}
                rules={{ required: 'Category is required' }}
                render={({ field }) => (
                  <SelectionList
                    label="Classification"
                    options={categories.map(c => ({ id: c.id, name: c.name, icon: <Tag size={14} /> }))}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.category_id?.message}
                    className="max-h-40"
                  />
                )}
              />
              {!isViewer && (
                <button
                  type="button"
                  onClick={() => setShowCreateCategory(true)}
                  className="w-full h-10 rounded-xl bg-slate-800/30 border border-white/5 hover:bg-slate-800/60 hover:border-white/10 text-[10px] font-black text-slate-400 hover:text-slate-200 uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={14} /> New Category
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Controller
              name="start_date"
              control={control}
              rules={{ required: 'Required' }}
              render={({ field }) => (
                <AdvancedDatePicker
                  label="Kickoff"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.start_date?.message}
                  position="top"
                />
              )}
            />
            <Controller
              name="due_date"
              control={control}
              rules={{ 
                required: 'Required',
                validate: (v) => !v || !startDate || v >= startDate || 'End date cannot be before start date'
              }}
              render={({ field }) => (
                <AdvancedDatePicker
                  label="Deadline"
                   value={field.value}
                  onChange={field.onChange}
                  error={errors.due_date?.message}
                  position="top"
                />
              )}
            />
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 block opacity-70">Allocation (Hrs)</label>
              <div className="relative group">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max={taskHoursLimit.limitHours ?? undefined}
                  className={`w-full rounded-xl h-12 pl-4 pr-12 text-[13px] font-bold bg-[#12141a]/60 border border-white/5 text-slate-200 focus:border-primary-500/50 outline-none transition-all ${errors.estimated_hours ? 'border-rose-500/50' : ''}`}
                  placeholder="0"
                  disabled={isViewer}
                  {...register('estimated_hours', {
                    required: 'Required',
                    validate: (value) => {
                      if (value === '' || value === null) return true
                      const parsed = Number(value)
                      if (parsed <= 0) return 'Must be positive'
                      if (taskHoursLimit.limitHours !== null && parsed > taskHoursLimit.limitHours) return 'Exceeds limit'
                      return true
                    }
                  })}
                />
                {!isViewer && (
                  <div className="absolute right-1 top-1 bottom-1 flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        const val = Number(watch('estimated_hours')) || 0
                        setValue('estimated_hours', val + 0.5, { shouldValidate: true, shouldDirty: true })
                      }}
                      className="flex-1 px-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-slate-500 hover:text-white transition-all flex items-center justify-center border border-white/5"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const val = Number(watch('estimated_hours')) || 0
                        if (val > 0.5) setValue('estimated_hours', val - 0.5, { shouldValidate: true, shouldDirty: true })
                      }}
                      className="flex-1 px-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-slate-500 hover:text-white transition-all flex items-center justify-center border border-white/5"
                    >
                      <ChevronDown size={12} />
                    </button>
                  </div>
                )}
              </div>
              {errors.estimated_hours && <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest ml-1">{errors.estimated_hours.message}</p>}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="label mb-0">Subtasks</label>
                <p className="text-[11px] text-slate-500 mt-1">Hierarchy view with inline expand, edit, delete, and nested creation.</p>
              </div>
              {!isViewer && (
                <button
                  type="button"
                  className="btn-secondary px-3 py-1.5 text-xs inline-flex items-center gap-1"
                  onClick={() => openSubtaskEditor(null, null)}
                >
                  <Plus size={12} /> Add Subtask
                </button>
              )}
            </div>
            {isLoadingSubtasks && (
              <p className="text-xs text-slate-500 mb-2">Loading subtasks...</p>
            )}
            {nestedSubtasks.roots.length > 0 ? (
              <div className="max-h-60 overflow-y-auto no-scrollbar pr-1 space-y-2">
                {renderSubtaskRows(nestedSubtasks.roots, nestedSubtasks.byParent)}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-700/80 bg-surface-900/35 px-4 py-4 text-xs text-slate-500">
                No subtasks yet. Use Add Subtask to create the first child task.
              </div>
            )}
          </div>

          <div className="text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
            {project && <span>Project: {project.name}</span>}
            <span>Workspace: {workspace.name}</span>
          </div>

          </div>

          {/* Fixed Footer */}
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/40 backdrop-blur-md">
            <div className="flex flex-col-reverse sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              {isEditing && canEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleDeleteClick}
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded transition-all self-start sm:self-center"
                  title="Delete Task"
                  icon={Trash2}
                />
              )}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 ml-auto w-full sm:w-auto sm:flex-1 sm:max-w-[360px]">
                <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                  {isViewer || !canEdit ? 'Close' : 'Cancel'}
                </Button>
                {canEdit && (
                  <Button
                    type="submit"
                    loading={isSubmitting || isSavingSubtasks}
                    disabled={!isValid}
                    loadingText={isEditing ? 'Saving...' : 'Creating...'}
                    className="flex-1"
                  >
                    {isEditing ? 'Update Task' : 'Create Task'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete Task?"
        message={`Are you sure you want to delete "${task?.title}"? This action cannot be undone.`}
        confirmText="Delete Task"
        isDanger={true}
        isLoading={isDeleting}
      />

      <CreateCategoryModal
        isOpen={showCreateCategory}
        onClose={() => setShowCreateCategory(false)}
        workspaceId={workspace?.id}
        onCreated={(category) => {
          setValue('category_id', category.id, { shouldValidate: true, shouldDirty: true })
        }}
      />

      <SubtaskModal
        isOpen={subtaskEditor.isOpen}
        onClose={closeSubtaskEditor}
        onSave={saveSubtaskEditor}
        initialSubtask={subtaskEditor.subtask}
        parentLabel={subtaskEditor.parent?.title || (subtaskEditor.parent ? 'Nested task' : 'Root task')}
        parentRange={subtaskEditor.parent || { start_date: startDate, due_date: dueDate }}
        members={members}
        categories={categories}
        isViewer={isViewer}
      />
    </div>
  )
}

