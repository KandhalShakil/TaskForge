import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useProjectStore } from '../../store/projectStore'
import { WORKSPACE_ICONS, WORKSPACE_COLORS } from '../../utils/constants'
import Button from '../common/Button'
import { extractApiError, validateProject } from '../../utils/validation'

export default function CreateProjectModal({ workspace, defaultSpaceId = '', defaultFolderId = '', onClose }) {
  const { createProject, spaces, folders } = useProjectStore()
  const [selectedIcon, setSelectedIcon] = useState('📁')
  const [selectedColor, setSelectedColor] = useState('#8b5cf6')
  const [formError, setFormError] = useState('')
  const defaultValues = useMemo(() => ({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    space: defaultSpaceId || '',
    folder: defaultFolderId || '',
  }), [defaultSpaceId, defaultFolderId])
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    setFocus,
    clearErrors,
    formState: { errors, isSubmitting, isValid },
  } = useForm({ mode: 'onChange', defaultValues })

  useEffect(() => {
    reset(defaultValues)
  }, [defaultValues, reset])

  const selectedSpaceId = watch('space')
  const selectedStartDate = watch('start_date')
  const availableFolders = useMemo(
    () => folders.filter((folder) => !selectedSpaceId || folder.space === selectedSpaceId),
    [folders, selectedSpaceId]
  )

  const onSubmit = async (data) => {
    setFormError('')
    clearErrors()

    const validation = validateProject(data)
    if (!validation.isValid) {
      setFormError(validation.generalError || 'All fields are required')
      Object.entries(validation.errors).forEach(([field, message]) => {
        setError(field, { type: 'manual', message })
      })
      const firstField = Object.keys(validation.errors)[0]
      if (firstField) setFocus(firstField)
      return
    }

    const payload = {
      ...data,
      name: (data.name || '').trim(),
      description: (data.description || '').trim(),
      workspace: workspace.id,
      icon: selectedIcon,
      color: selectedColor,
      space: data.space || null,
      folder: data.folder || null,
    }
    if (!payload.space) delete payload.space
    if (!payload.folder) delete payload.folder

    try {
      await createProject(payload)
      toast.success('Project created!')
      onClose()
    } catch (err) {
      const message = extractApiError(err, 'Failed to create project')
      setFormError(message)
      toast.error(message)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">Create List</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {formError && (
            <div className="rounded-lg border border-red-700/50 bg-red-950/40 px-3 py-2 text-xs text-red-200">
              {formError}
            </div>
          )}
          <div>
            <label className="label">List Name *</label>
            <input
              className={`input ${errors.name ? 'border-red-500' : ''}`}
              placeholder="Sprint Backlog"
              {...register('name', { required: 'Name is required' })}
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="label">Description *</label>
            <textarea
              className={`input min-h-[70px] resize-none ${errors.description ? 'border-red-500' : ''}`}
              placeholder="What's this project about?"
              {...register('description', { required: 'Description is required' })}
            />
            {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date *</label>
              <input
                type="date"
                className={`input ${errors.start_date ? 'border-red-500' : ''}`}
                {...register('start_date', { required: 'Start date is required' })}
              />
              {errors.start_date && <p className="text-red-400 text-xs mt-1">{errors.start_date.message}</p>}
            </div>
            <div>
              <label className="label">End Date *</label>
              <input
                type="date"
                className={`input ${errors.end_date ? 'border-red-500' : ''}`}
                {...register('end_date', {
                  required: 'End date is required',
                  validate: (value) => {
                    if (!value || !selectedStartDate) return true
                    return value >= selectedStartDate || 'End date cannot be before start date'
                  },
                })}
              />
              {errors.end_date && <p className="text-red-400 text-xs mt-1">{errors.end_date.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Space</label>
              <select className="select" {...register('space')}>
                <option value="">No space</option>
                {spaces.map((space) => (
                  <option key={space.id} value={space.id}>{space.icon} {space.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Folder</label>
              <select className="select" {...register('folder')}>
                <option value="">No folder</option>
                {availableFolders.map((folder) => (
                  <option key={folder.id} value={folder.id}>{folder.icon} {folder.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Icon</label>
            <div className="flex flex-wrap gap-2">
              {WORKSPACE_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`w-9 h-9 rounded-lg text-lg hover:scale-110 transition-all ${
                    selectedIcon === icon ? 'ring-2 ring-primary-500 bg-surface-700' : 'hover:bg-surface-700'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Color</label>
            <div className="flex flex-wrap gap-2">
              {WORKSPACE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-7 h-7 rounded-full transition-all hover:scale-110 ${
                    selectedColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-900 scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Workspace: <span className="text-slate-300">{workspace.name}</span>
          </p>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={!isValid} className="flex-1">
              Create List
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
