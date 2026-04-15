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
      if (!items.length) return [{ id: null, title: '', is_completed: false }]
      return items.map((item) => ({
        id: item.id || null,
        title: item.title || '',
        is_completed: Boolean(item.is_completed),
      }))
    }

    const loadSubtasks = async () => {
      if (!isEditing) {
        if (active) {
          setSubtasks([{ id: null, title: '', is_completed: false }])
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
          setSubtasks([{ id: null, title: '', is_completed: false }])
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

  const addSubtaskRow = () => {
    setSubtasks((prev) => [...prev, { id: null, title: '', is_completed: false }])
  }

  const updateSubtaskRow = (index, value) => {
    setSubtasks((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], title: value }
      return next
    })
  }

  const removeSubtaskRow = (index) => {
    setSubtasks((prev) => {
      if (prev.length === 1) return prev
      return prev.filter((_, i) => i !== index)
    })
  }

  const toggleSubtaskComplete = (index) => {
    setSubtasks((prev) => {
      const next = [...prev]
      next[index] = {
        ...next[index],
        is_completed: !next[index].is_completed,
      }
      return next
    })
  }

  const onSubmit = async (data) => {
    try {
      const cleanedSubtasks = subtasks
        .map((subtask, index) => ({
          id: subtask.id || null,
          title: (subtask.title || '').trim(),
          is_completed: Boolean(subtask.is_completed),
          order: index,
        }))
        .filter((subtask) => subtask.title.length > 0)

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
              subtasks_input: cleanedSubtasks.map((subtask) => ({
                title: subtask.title,
                order: subtask.order,
              })),
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
              is_completed: subtask.is_completed,
              order: subtask.order,
            })
          ),
          ...removedIds.map((id) => tasksAPI.deleteSubtask(id)),
          ...newlyAdded.map((subtask) =>
            tasksAPI.addSubtask(task.id, {
              task: task.id,
              title: subtask.title,
              is_completed: subtask.is_completed,
              order: subtask.order,
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
              {subtasks.map((subtask, index) => (
                <div key={`subtask-${index}`} className="flex items-center gap-2">
                  {!isViewer && (
                    <button
                      type="button"
                      className="btn-ghost p-1.5"
                      onClick={() => toggleSubtaskComplete(index)}
                      title={subtask.is_completed ? 'Mark as not completed' : 'Mark as completed'}
                    >
                      {subtask.is_completed ? <CheckSquare size={14} /> : <Square size={14} />}
                    </button>
                  )}
                  <input
                    type="text"
                    className={`input ${subtask.is_completed ? 'line-through text-slate-500' : ''}`}
                    placeholder={`Subtask ${index + 1}`}
                    value={subtask.title}
                    onChange={(e) => updateSubtaskRow(index, e.target.value)}
                    disabled={isViewer}
                  />
                  {!isViewer && (
                    <button
                      type="button"
                      className="btn-ghost p-1.5 text-red-400 hover:bg-red-950/30"
                      onClick={() => removeSubtaskRow(index)}
                      disabled={subtasks.length === 1}
                      title="Remove subtask"
                    >
                      <XCircle size={14} />
                    </button>
                  )}
                </div>
              ))}
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

