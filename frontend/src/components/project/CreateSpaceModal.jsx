import { useForm } from 'react-hook-form'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useState } from 'react'
import { useProjectStore } from '../../store/projectStore'
import { WORKSPACE_ICONS, WORKSPACE_COLORS } from '../../utils/constants'
import Button from '../common/Button'

export default function CreateSpaceModal({ workspace, onClose, onCreated }) {
  const { createSpace } = useProjectStore()
  const [selectedIcon, setSelectedIcon] = useState('🧭')
  const [selectedColor, setSelectedColor] = useState('#3b82f6')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()

  const onSubmit = async (data) => {
    const name = (data.name || '').trim()
    if (!name) {
      toast.error('Space name is required')
      return
    }

    try {
      await createSpace({
        workspace: workspace.id,
        name,
        description: (data.description || '').trim(),
        icon: selectedIcon,
        color: selectedColor,
      })
      toast.success('Space created')
      onCreated?.()
      onClose()
    } catch {
      toast.error('Failed to create space')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">Create Space</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="label">Space Name *</label>
            <input
              className={`input ${errors.name ? 'border-red-500' : ''}`}
              placeholder="Product"
              {...register('name', { required: 'Space name is required' })}
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-[70px] resize-none"
              placeholder="Describe this space"
              {...register('description')}
            />
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

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting} className="flex-1">
              Create Space
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
