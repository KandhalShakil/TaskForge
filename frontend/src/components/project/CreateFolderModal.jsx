import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useProjectStore } from '../../store/projectStore'
import { WORKSPACE_ICONS, WORKSPACE_COLORS } from '../../utils/constants'
import Button from '../common/Button'

export default function CreateFolderModal({ workspace, defaultSpaceId, onClose, onCreated }) {
  const { createFolder, spaces } = useProjectStore()
  const [selectedIcon, setSelectedIcon] = useState('🗂️')
  const [selectedColor, setSelectedColor] = useState('#8b5cf6')
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      space: defaultSpaceId || '',
    },
  })

  const selectedSpaceId = watch('space')

  const sortedSpaces = useMemo(
    () => [...spaces].sort((a, b) => (a.order || 0) - (b.order || 0)),
    [spaces]
  )

  const onSubmit = async (data) => {
    const name = (data.name || '').trim()
    if (!name) {
      toast.error('Folder name is required')
      return
    }
    if (!data.space) {
      toast.error('Please choose a space')
      return
    }

    try {
      await createFolder({
        workspace: workspace.id,
        space: data.space,
        name,
        description: (data.description || '').trim(),
        icon: selectedIcon,
        color: selectedColor,
      })
      toast.success('Folder created')
      onCreated?.()
      onClose()
    } catch {
      toast.error('Failed to create folder')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">Create Folder</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="label">Folder Name *</label>
            <input
              className={`input ${errors.name ? 'border-red-500' : ''}`}
              placeholder="Sprint Planning"
              {...register('name', { required: 'Folder name is required' })}
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="label">Space *</label>
            <select className={`select ${errors.space ? 'border-red-500' : ''}`} {...register('space', { required: 'Space is required' })}>
              <option value="">Select a space</option>
              {sortedSpaces.map((space) => (
                <option key={space.id} value={space.id}>{space.icon} {space.name}</option>
              ))}
            </select>
            {errors.space && <p className="text-red-400 text-xs mt-1">{errors.space.message}</p>}
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-[70px] resize-none"
              placeholder="Describe this folder"
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
              Create Folder
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
