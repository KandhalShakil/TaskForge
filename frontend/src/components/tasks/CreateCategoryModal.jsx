import { useEffect, useState } from 'react'
import { Tag, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTaskStore } from '../../store/taskStore'
import Button from '../common/Button'
import { extractApiError } from '../../utils/validation'

const DEFAULT_COLOR = '#6366f1'

export default function CreateCategoryModal({ isOpen, onClose, workspaceId, onCreated }) {
  const { createCategory } = useTaskStore()
  const [name, setName] = useState('')
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setName('')
      setColor(DEFAULT_COLOR)
      setIsSaving(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (event) => {
    event.preventDefault()

    const trimmedName = name.trim()
    if (!workspaceId) {
      toast.error('Workspace is required to create a category')
      return
    }

    if (!trimmedName) {
      toast.error('Category name is required')
      return
    }

    setIsSaving(true)
    try {
      const category = await createCategory({
        workspace: workspaceId,
        name: trimmedName,
        color,
      })
      toast.success('Category created')
      onCreated?.(category)
      onClose()
    } catch (error) {
      toast.error(extractApiError(error, 'Failed to create category'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Tag size={16} /> Add Category
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="label">Category name</label>
            <input
              className="input"
              placeholder="Marketing, Design, Backend..."
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="label">Color</label>
            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-surface-900/60 px-3 py-2">
              <input
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                className="h-10 w-12 rounded-md border border-slate-700 bg-transparent p-1"
              />
              <div>
                <p className="text-sm text-slate-200">{color.toUpperCase()}</p>
                <p className="text-xs text-slate-500">Used for labels and filters</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isSaving} loadingText="Saving...">
              Create category
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}