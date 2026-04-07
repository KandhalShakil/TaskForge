import { useForm } from 'react-hook-form'
import { X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useProjectStore } from '../../store/projectStore'
import { WORKSPACE_ICONS, WORKSPACE_COLORS } from '../../utils/constants'
import { useState } from 'react'
import Button from '../common/Button'

export default function CreateProjectModal({ workspace, onClose }) {
  const { createProject } = useProjectStore()
  const [selectedIcon, setSelectedIcon] = useState('📁')
  const [selectedColor, setSelectedColor] = useState('#8b5cf6')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()

  const onSubmit = async (data) => {
    // Clean empty strings for optional fields
    const payload = {
      ...data,
      workspace: workspace.id,
      icon: selectedIcon,
      color: selectedColor,
    }
    if (!payload.description) delete payload.description
    if (!payload.start_date) delete payload.start_date
    if (!payload.end_date) delete payload.end_date

    try {
      await createProject(payload)
      toast.success('Project created!')
      onClose()
    } catch (err) {
      toast.error('Failed to create project')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">Create Project</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="label">Project Name *</label>
            <input
              className={`input ${errors.name ? 'border-red-500' : ''}`}
              placeholder="Website Redesign"
              {...register('name', { required: 'Name is required' })}
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-[70px] resize-none"
              placeholder="What's this project about?"
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date</label>
              <input type="date" className="input" {...register('start_date')} />
            </div>
            <div>
              <label className="label">End Date</label>
              <input type="date" className="input" {...register('end_date')} />
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
            <Button type="submit" loading={isSubmitting} className="flex-1">
              Create Project
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
