import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { X, Loader2, Calendar, User, Tag, Flag, AlignLeft, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTaskStore } from '../../store/taskStore'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { TASK_STATUSES, TASK_PRIORITIES } from '../../utils/constants'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

export default function TaskModal({ task, project, workspace, onClose }) {
  const { createTask, updateTask, deleteTask, categories } = useTaskStore()
  const { members } = useWorkspaceStore()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const isEditing = !!task

  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm({
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

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        workspace: workspace.id,
        project: project?.id || null,
        assignee_id: data.assignee_id || null,
        category_id: data.category_id || null,
        estimated_hours: data.estimated_hours || null,
      }

      if (isEditing) {
        await updateTask(task.id, payload)
        toast.success('Task updated!')
      } else {
        await createTask(payload)
        toast.success('Task created!')
      }
      onClose()
    } catch (err) {
      toast.error('Failed to save task')
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

  if (showDeleteConfirm) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
          <div className="w-12 h-12 rounded-full bg-red-900/30 text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-800/50">
            <Trash2 size={24} />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Delete Task?</h2>
          <p className="text-sm text-slate-400 mb-6 px-2">
            Are you sure you want to delete <span className="text-white font-medium">"{task?.title}"</span>? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="btn-secondary flex-1 justify-center"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="btn-primary bg-red-600 hover:bg-red-700 text-white flex-1 justify-center border-none"
              disabled={isDeleting}
            >
              {isDeleting ? <><Loader2 size={14} className="animate-spin" /> Deleting...</> : 'Yes, Delete'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">
            {isEditing ? 'Edit Task' : 'Create Task'}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <input
              className={`input text-base font-medium ${errors.title ? 'border-red-500' : ''}`}
              placeholder="Task title..."
              {...register('title', { required: 'Title is required' })}
            />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <AlignLeft size={14} className="text-slate-500" />
              <label className="text-xs font-medium text-slate-400">Description</label>
            </div>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <div className="bg-surface-900 border border-slate-700 rounded-lg overflow-hidden [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-slate-700 [&_.ql-toolbar]:bg-surface-800 [&_.ql-container]:border-none [&_.ql-editor]:min-h-[150px] [&_.ql-editor]:text-sm [&_.ql-editor]:text-slate-200 [&_.ql-stroke]:stroke-slate-400 [&_.ql-fill]:fill-slate-400 [&_.ql-picker]:text-slate-400">
                  <ReactQuill theme="snow" value={field.value || ''} onChange={field.onChange} placeholder="Add a formatted description..." />
                </div>
              )}
            />
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label flex items-center gap-1.5"><Flag size={12} /> Status</label>
              <select className="select" {...register('status')}>
                {TASK_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label flex items-center gap-1.5"><Flag size={12} /> Priority</label>
              <select className="select" {...register('priority')}>
                {TASK_PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.icon} {p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Assignee + Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label flex items-center gap-1.5"><User size={12} /> Assignee</label>
              <select className="select" {...register('assignee_id')}>
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user.id} value={m.user.id}>{m.user.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label flex items-center gap-1.5"><Tag size={12} /> Category</label>
              <select className="select" {...register('category_id')}>
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates + Hours */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label flex items-center gap-1.5"><Calendar size={12} /> Start Date</label>
              <input type="date" className="input" {...register('start_date')} />
            </div>
            <div>
              <label className="label flex items-center gap-1.5"><Calendar size={12} /> Due Date</label>
              <input type="date" className="input" {...register('due_date')} />
            </div>
            <div>
              <label className="label">Est. Hours</label>
              <input
                type="number"
                step="0.5"
                min="0"
                className="input"
                placeholder="0"
                {...register('estimated_hours')}
              />
            </div>
          </div>

          {/* Context info */}
          <div className="text-xs text-slate-500 flex items-center gap-3">
            {project && <span>📁 {project.name}</span>}
            <span>🏢 {workspace.name}</span>
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-800 items-center justify-between">
            {isEditing && (
              <button
                type="button"
                onClick={handleDeleteClick}
                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded transition-all"
                title="Delete Task"
              >
                <Trash2 size={16} />
              </button>
            )}
            <div className="flex items-center gap-3 ml-auto flex-1 max-w-[280px]">
              <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 justify-center">
                {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : (isEditing ? 'Update Task' : 'Create Task')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
