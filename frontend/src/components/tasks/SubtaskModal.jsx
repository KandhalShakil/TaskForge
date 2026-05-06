import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { X, Calendar, User, Tag, Flag, AlignLeft, CheckSquare, ChevronUp, ChevronDown } from 'lucide-react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import Button from '../common/Button'
import SelectionList from '../common/SelectionList'
import AdvancedDatePicker from '../common/AdvancedDatePicker'
import SegmentedControl from '../common/SegmentedControl'
import { stripHtml } from '../../utils/html'
import { validateSubtask } from '../../utils/validation'
import { TASK_STATUSES, TASK_PRIORITIES } from '../../utils/constants'

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
  parentRange,
  members = [],
  categories = [],
  isViewer = false,
}) {
  const [formError, setFormError] = useState('')
  const isEditing = Boolean(initialSubtask)
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setError,
    setFocus,
    clearErrors,
    formState: { errors, isSubmitting, isValid },
  } = useForm({
    mode: 'onChange',
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
    setFormError('')
    clearErrors()

    const validation = validateSubtask(data, { parent: parentRange })
    if (!validation.isValid) {
      setFormError(validation.generalError || 'All fields are required')
      Object.entries(validation.errors).forEach(([field, message]) => {
        setError(field, { type: 'manual', message })
      })
      const firstField = Object.keys(validation.errors)[0]
      if (firstField) setFocus(firstField)
      return
    }

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

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-6">
          {formError && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-rose-400">
              {formError}
            </div>
          )}
          
          <div className="space-y-1">
            <input
              className={`w-full bg-transparent border-none text-2xl font-black text-white placeholder:text-slate-800 outline-none p-0 ${errors.title ? 'text-rose-400' : ''}`}
              placeholder="Protocol Identifier..."
              disabled={isViewer}
              {...register('title', { required: 'Title is required' })}
              autoFocus
            />
            <div className="h-px w-full bg-gradient-to-r from-slate-800 via-slate-800 to-transparent" />
            {errors.title && <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-1 ml-1">{errors.title.message}</p>}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <AlignLeft size={14} className="text-primary-500" />
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Deployment Specs</label>
            </div>
            <Controller
              name="description"
              control={control}
              rules={{ required: 'Description is required' }}
              render={({ field }) => (
                <div className={`bg-[#0b0c10]/60 border border-white/5 rounded-2xl overflow-hidden [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-white/5 [&_.ql-toolbar]:bg-white/[0.02] [&_.ql-container]:border-none [&_.ql-editor]:min-h-[150px] [&_.ql-editor]:text-[13px] [&_.ql-editor]:font-medium [&_.ql-editor]:text-slate-300 [&_.ql-stroke]:stroke-slate-500 [&_.ql-fill]:fill-slate-500 [&_.ql-picker]:text-slate-500 ${isViewer ? '[&_.ql-toolbar]:hidden' : ''}`}>
                  <ReactQuill theme="snow" value={field.value || ''} onChange={field.onChange} placeholder="Initialize sub-protocol details..." readOnly={isViewer} />
                </div>
              )}
            />
            {errors.description && <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-1 ml-1">{errors.description.message}</p>}
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
                  disabled={isViewer}
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
                  className={`w-full rounded-xl h-12 pl-4 pr-12 text-[13px] font-bold bg-[#12141a]/60 border border-white/5 text-slate-200 focus:border-primary-500/50 outline-none transition-all ${errors.estimated_hours ? 'border-rose-500/50' : ''}`}
                  placeholder="0"
                  disabled={isViewer}
                  {...register('estimated_hours', {
                    required: 'Required',
                    validate: (value) => {
                      if (value === '' || value === null) return true
                      const parsed = Number(value)
                      return parsed > 0 || 'Must be positive'
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

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2 border-t border-slate-800 items-stretch sm:items-center justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            {!isViewer && (
              <Button type="submit" loading={isSubmitting} loadingText={isEditing ? 'Saving...' : 'Creating...'} disabled={!isValid}>
                {isEditing ? 'Save Subtask' : 'Create Subtask'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}