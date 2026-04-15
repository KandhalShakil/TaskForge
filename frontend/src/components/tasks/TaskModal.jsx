import { useEffect, useMemo, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { X, Calendar, User, Tag, Flag, AlignLeft, Trash2, Plus, CheckSquare, Square, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTaskStore } from '../../store/taskStore'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { TASK_STATUSES, TASK_PRIORITIES } from '../../utils/constants'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { useAuthStore } from '../../store/authStore'
import ConfirmModal from '../common/ConfirmModal'
import Button from '../common/Button'
import { tasksAPI } from '../../api/tasks'

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
      status: item?.status || 'todo',
      priority: item?.priority || 'no_priority',
      assignee_id: item?.assignee?.id || item?.assignee_id || '',
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
  status: 'todo',
  priority: 'no_priority',
  assignee_id: '',
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
      assignee_id: item.assignee_id || null,
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
      status: item.status || 'todo',
      priority: item.priority || 'no_priority',
      assignee_id: item.assignee_id,
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
    status: node.status,
    priority: node.priority,
    assignee_id: node.assignee_id,
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
  const isEditing = !!task

  const [subtasks, setSubtasks] = useState([])
  const [initialSubtaskIds, setInitialSubtaskIds] = useState([])

  const userRole = getUserRole(user?.id)
  const isViewer = userRole === 'viewer'

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm({
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

  useEffect(() => {
    let active = true

    const normalizeSubtasks = (items = []) => {
      if (!items.length) return [createEmptySubtask()]

      const flattened = flattenSubtasks(items)
      const normalized = hydrateParentTempKeys(flattened)
      return normalized.length ? normalized : [createEmptySubtask()]
    }

    const loadSubtasks = async () => {
      if (!isEditing) {
        if (active) {
          setSubtasks([createEmptySubtask()])
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
          setSubtasks([createEmptySubtask()])
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

  const hasSubtaskContent = useMemo(
    () => subtasks.some((subtask) => (subtask.title || '').trim().length > 0),
    [subtasks]
  )

  const nestedSubtasks = useMemo(() => {
    const byParent = buildChildrenMap(subtasks)
    return {
      roots: byParent.get(null) || [],
      byParent,
    }
  }, [subtasks])

  const addSubtaskRow = (parentNode = null) => {
    setSubtasks((prev) => [
      ...prev,
      createEmptySubtask(parentNode ? (parentNode.id || parentNode.temp_key) : null),
    ])
  }

  const updateSubtaskField = (nodeKey, field, value) => {
    setSubtasks((prev) => {
      return prev.map((item) => {
        const key = item.id || item.temp_key
        if (key !== nodeKey) {
          return item
        }
        return { ...item, [field]: value }
      })
    })
  }

  const removeSubtaskRow = (node) => {
    setSubtasks((prev) => {
      const childrenMap = buildChildrenMap(prev)
      const branchKeys = collectBranchKeys(node, childrenMap)
      const remaining = prev.filter((item) => !branchKeys.has(item.id || item.temp_key))

      if (!remaining.length) {
        return [createEmptySubtask()]
      }
      return remaining
    })
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

  const onSubmit = async (data) => {
    try {
      const cleanedSubtasks = normalizeSubtasksForSave(subtasks)

      const payload = {
        ...data,
        workspace: workspace.id,
        project: project?.id || null,
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
              status: subtask.status,
              priority: subtask.priority,
              assignee_id: subtask.assignee_id,
              start_date: subtask.start_date,
              due_date: subtask.due_date,
              estimated_hours: subtask.estimated_hours,
              is_completed: subtask.is_completed,
              order: subtask.order,
              parent_id: subtask.parent_key,
            })
          ),
          ...removedIds.map((id) => tasksAPI.deleteSubtask(id)),
          ...newlyAdded.map((subtask) =>
            tasksAPI.addSubtask(task.id, {
              task: task.id,
              title: subtask.title,
              status: subtask.status,
              priority: subtask.priority,
              assignee_id: subtask.assignee_id,
              start_date: subtask.start_date,
              due_date: subtask.due_date,
              estimated_hours: subtask.estimated_hours,
              is_completed: subtask.is_completed,
              order: subtask.order,
              parent_id: subtask.parent_key,
            })
          ),
        ])
        toast.success('Task updated!')
      } else {
        await createTask(payload)
        toast.success('Task created!')
      }
      onClose()
    } catch (err) {
      toast.error('Failed to save task')
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

  const renderSubtaskRows = (nodes, byParent, depth = 0) => {
    return nodes.map((subtask, index) => {
      const nodeKey = subtask.id || subtask.temp_key
      const children = byParent.get(nodeKey) || []

      return (
        <div key={nodeKey} className="space-y-2">
          <div className="flex items-center gap-2" style={{ marginLeft: `${depth * 20}px` }}>
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
            {isViewer && (
              <span className="p-1.5 text-slate-500">
                {subtask.is_completed ? <CheckSquare size={14} /> : <Square size={14} />}
              </span>
            )}
            <input
              type="text"
              className={`input ${subtask.is_completed ? 'line-through text-slate-500' : ''}`}
              placeholder={depth > 0 ? `Nested subtask ${index + 1}` : `Subtask ${index + 1}`}
              value={subtask.title}
              onChange={(e) => updateSubtaskField(nodeKey, 'title', e.target.value)}
              disabled={isViewer}
            />
            {!isViewer && (
              <button
                type="button"
                className="btn-ghost p-1.5 text-slate-400 hover:text-slate-200"
                onClick={() => addSubtaskRow(subtask)}
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
                disabled={subtasks.length === 1}
                title="Remove subtask branch"
              >
                <XCircle size={14} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2" style={{ marginLeft: `${depth * 20 + 44}px` }}>
            <select
              className="select"
              value={subtask.status}
              onChange={(e) => updateSubtaskField(nodeKey, 'status', e.target.value)}
              disabled={isViewer}
              title="Subtask status"
            >
              {TASK_STATUSES.map((statusItem) => (
                <option key={statusItem.value} value={statusItem.value}>{statusItem.label}</option>
              ))}
            </select>
            <select
              className="select"
              value={subtask.priority}
              onChange={(e) => updateSubtaskField(nodeKey, 'priority', e.target.value)}
              disabled={isViewer}
              title="Subtask priority"
            >
              {TASK_PRIORITIES.map((priorityItem) => (
                <option key={priorityItem.value} value={priorityItem.value}>{priorityItem.icon} {priorityItem.label}</option>
              ))}
            </select>
            <select
              className="select"
              value={subtask.assignee_id || ''}
              onChange={(e) => updateSubtaskField(nodeKey, 'assignee_id', e.target.value)}
              disabled={isViewer}
              title="Subtask assignee"
            >
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.user.id} value={member.user.id}>{member.user.full_name}</option>
              ))}
            </select>
            <input
              type="date"
              className="input"
              value={subtask.start_date || ''}
              onChange={(e) => updateSubtaskField(nodeKey, 'start_date', e.target.value)}
              disabled={isViewer}
              title="Subtask start date"
            />
            <input
              type="date"
              className="input"
              value={subtask.due_date || ''}
              onChange={(e) => updateSubtaskField(nodeKey, 'due_date', e.target.value)}
              disabled={isViewer}
              title="Subtask due date"
            />
            <input
              type="number"
              step="0.5"
              min="0"
              className="input"
              placeholder="Est. Hours"
              value={subtask.estimated_hours ?? ''}
              onChange={(e) => updateSubtaskField(nodeKey, 'estimated_hours', e.target.value)}
              disabled={isViewer}
              title="Subtask estimated hours"
            />
          </div>
          {children.length > 0 && renderSubtaskRows(children, byParent, depth + 1)}
        </div>
      )
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            {isEditing ? 'Edit Task' : 'Create Task'}
            {isViewer && <span className="badge bg-slate-800 text-slate-400 text-[10px] uppercase tracking-wider px-2 py-0.5">Read Only</span>}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <div>
            <input
              className={`input text-base font-medium ${errors.title ? 'border-red-500' : ''}`}
              placeholder="Task title..."
              disabled={isViewer}
              {...register('title', { required: 'Title is required' })}
            />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <AlignLeft size={14} className="text-slate-500" />
              <label className="text-xs font-medium text-slate-400">Description</label>
            </div>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <div className={`bg-surface-900 border border-slate-700 rounded-lg overflow-hidden [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-slate-700 [&_.ql-toolbar]:bg-surface-800 [&_.ql-container]:border-none [&_.ql-editor]:min-h-[150px] [&_.ql-editor]:text-sm [&_.ql-editor]:text-slate-200 [&_.ql-stroke]:stroke-slate-400 [&_.ql-fill]:fill-slate-400 [&_.ql-picker]:text-slate-400 ${isViewer ? '[&_.ql-toolbar]:hidden' : ''}`}>
                  <ReactQuill theme="snow" value={field.value || ''} onChange={field.onChange} placeholder="Add a formatted description..." readOnly={isViewer} />
                </div>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label flex items-center gap-1.5"><Flag size={12} /> Status</label>
              <select className="select" {...register('status')} disabled={isViewer}>
                {TASK_STATUSES.map((statusItem) => (
                  <option key={statusItem.value} value={statusItem.value}>{statusItem.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label flex items-center gap-1.5"><Flag size={12} /> Priority</label>
              <select className="select" {...register('priority')} disabled={isViewer}>
                {TASK_PRIORITIES.map((priorityItem) => (
                  <option key={priorityItem.value} value={priorityItem.value}>{priorityItem.icon} {priorityItem.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label flex items-center gap-1.5"><User size={12} /> Assignee</label>
              <select className="select" {...register('assignee_id')} disabled={isViewer}>
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.user.id} value={member.user.id}>{member.user.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label flex items-center gap-1.5"><Tag size={12} /> Category</label>
              <select className="select" {...register('category_id')} disabled={isViewer}>
                <option value="">No category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label flex items-center gap-1.5"><Calendar size={12} /> Start Date</label>
              <input type="date" className="input" {...register('start_date')} disabled={isViewer} />
            </div>
            <div>
              <label className="label flex items-center gap-1.5"><Calendar size={12} /> Due Date</label>
              <input type="date" className="input" {...register('due_date')} disabled={isViewer} />
            </div>
            <div>
              <label className="label">Est. Hours</label>
              <input
                type="number"
                step="0.5"
                min="0"
                className="input"
                placeholder="0"
                disabled={isViewer}
                {...register('estimated_hours')}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Subtasks</label>
              {!isViewer && (
                <button
                  type="button"
                  className="btn-secondary px-3 py-1.5 text-xs inline-flex items-center gap-1"
                  onClick={addSubtaskRow}
                >
                  <Plus size={12} /> Add Subtask
                </button>
              )}
            </div>
            {isLoadingSubtasks && (
              <p className="text-xs text-slate-500 mb-2">Loading subtasks...</p>
            )}
            <div className="space-y-2">
              {renderSubtaskRows(nestedSubtasks.roots, nestedSubtasks.byParent)}
            </div>
            {!hasSubtaskContent && (
              <p className="text-xs text-slate-500 mt-2">Add at least one subtask to break this task into smaller steps.</p>
            )}
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-3">
            {project && <span>Project: {project.name}</span>}
            <span>Workspace: {workspace.name}</span>
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-800 items-center justify-between">
            {isEditing && !isViewer && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleDeleteClick}
                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded transition-all"
                title="Delete Task"
                icon={Trash2}
              />
            )}
            <div className="flex items-center gap-3 ml-auto flex-1 max-w-[280px]">
              <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                {isViewer ? 'Close' : 'Cancel'}
              </Button>
              {!isViewer && (
                <Button
                  type="submit"
                  loading={isSubmitting || isSavingSubtasks}
                  loadingText={isEditing ? 'Saving...' : 'Creating...'}
                  className="flex-1"
                >
                  {isEditing ? 'Update Task' : 'Create Task'}
                </Button>
              )}
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
    </div>
  )
}

