import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { X, Calendar, User, Tag, Flag, AlignLeft, CheckSquare } from 'lucide-react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import Button from '../common/Button'
import { stripHtml } from '../../utils/html'

const toFormValues = (subtask) => ({
  title: subtask?.title || '',
  description: subtask?.description || '',
  status: subtask?.status || 'todo',
  priority: subtask?.priority || 'no_priority',
  assignee_id: subtask?.assignee?.id || subtask?.assignee_id || '',
  category_id: subtask?.category?.id || subtask?.category_id || '',
  start_date: subtask?.start_date || '',
  due_date: subtask?.due_date || '',
  estimated_hours: subtask?.estimated_hours ?? '',
  is_completed: Boolean(subtask?.is_completed),
})

const normalizeValue = (value) => (value === '' || value === undefined ? null : value)

export default function SubtaskModal({
  isOpen,
  onClose,
  onSave,
  initialSubtask,
  parentLabel,
  members = [],
  categories = [],
  isViewer = false,
}) {
  const isEditing = Boolean(initialSubtask)
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: toFormValues(initialSubtask),
  })

  const startDate = watch('start_date')

  useEffect(() => {
    if (isOpen) {
      reset(toFormValues(initialSubtask))
    }
  }, [initialSubtask, isOpen, reset])

  if (!isOpen) {
    return null
  }

  const onSubmit = async (data) => {
    await onSave({
      ...initialSubtask,
      ...data,
      title: (data.title || '').trim(),
      description: stripHtml(data.description),
      assignee_id: normalizeValue(data.assignee_id),
      category_id: normalizeValue(data.category_id),
      start_date: normalizeValue(data.start_date),
      due_date: normalizeValue(data.due_date),
      estimated_hours: normalizeValue(data.estimated_hours),
      is_completed: Boolean(data.is_completed),
    })
  }

  const title = isEditing ? 'Edit Subtask' : 'Add Subtask'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">{title}</h2>
            {parentLabel && (
              <p className="text-xs text-slate-500 mt-1">Parent: {parentLabel}</p>
            )}
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <div>
            <input
              className={`input text-base font-medium ${errors.title ? 'border-red-500' : ''}`}
              placeholder="Subtask title..."
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
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="done">Done</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="label flex items-center gap-1.5"><Flag size={12} /> Priority</label>
              <select className="select" {...register('priority')} disabled={isViewer}>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="no_priority">No Priority</option>
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
              <input type="date" className={`input ${errors.start_date ? 'border-red-500' : ''}`} {...register('start_date')} disabled={isViewer} />
            </div>
            <div>
              <label className="label flex items-center gap-1.5"><Calendar size={12} /> Due Date</label>
              <input
                type="date"
                className={`input ${errors.due_date ? 'border-red-500' : ''}`}
                {...register('due_date', {
                  validate: (value) => {
                    if (!value || !startDate) return true
                    return value >= startDate || 'Due date cannot be earlier than start date'
                  },
                })}
                disabled={isViewer}
              />
              {errors.due_date && <p className="text-red-400 text-xs mt-1">{errors.due_date.message}</p>}
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
                {...register('estimated_hours', {
                  validate: (value) => {
                    if (value === '' || value === null || value === undefined) return true
                    const parsed = Number(value)
                    return Number.isFinite(parsed) && parsed >= 0 || 'Estimated hours must be a number greater than or equal to 0'
                  },
                })}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-surface-900/50 px-4 py-3">
            <input
              id="is_completed"
              type="checkbox"
              className="h-4 w-4 rounded border-slate-700 bg-surface-800 text-primary-500 focus:ring-primary-500/30"
              {...register('is_completed')}
              disabled={isViewer}
            />
            <label htmlFor="is_completed" className="text-sm text-slate-300 flex items-center gap-1.5">
              <CheckSquare size={14} /> Mark as completed
            </label>
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-800 items-center justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            {!isViewer && (
              <Button type="submit" loading={isSubmitting} loadingText={isEditing ? 'Saving...' : 'Creating...'}>
                {isEditing ? 'Save Subtask' : 'Create Subtask'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}