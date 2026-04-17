import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import toast from 'react-hot-toast'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { useTaskStore } from '../../store/taskStore'
import { useProjectStore } from '../../store/projectStore'
import { tasksAPI } from '../../api/tasks'
import { workspacesAPI } from '../../api/workspaces'
import Button from '../../components/common/Button'
import ConfirmModal from '../../components/common/ConfirmModal'
import { TASK_STATUSES, TASK_PRIORITIES } from '../../utils/constants'
import { stripHtml } from '../../utils/html'

export default function SubtaskDetailPage() {
  const navigate = useNavigate()
  const { workspaceId, projectId, taskId, subtaskId } = useParams()
  const { categories, updateTask, deleteTask } = useTaskStore()
  const { getProjectById, fetchProjectById, setActiveProject } = useProjectStore()

  const [subtask, setSubtask] = useState(null)
  const [parentTask, setParentTask] = useState(null)
  const [project, setProject] = useState(null)
  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm()

  const startDate = watch('start_date')

  useEffect(() => {
    loadData()
  }, [workspaceId, projectId, taskId, subtaskId])

  const loadData = async () => {
    if (!workspaceId || !projectId || !taskId || !subtaskId) {
      setError('Missing route context for subtask page.')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError('')

      let proj = getProjectById(projectId)
      if (!proj) {
        proj = await fetchProjectById(projectId)
      }
      setProject(proj)
      setActiveProject(proj)

      const [{ data: parent }, { data: target }] = await Promise.all([
        tasksAPI.getTask(taskId),
        tasksAPI.getSubtask(subtaskId),
      ])

      setParentTask(parent)
      setSubtask(target)
      reset({
        title: target.title,
        description: target.description,
        status: target.status,
        priority: target.priority,
        assignee_id: target.assignee?.id || '',
        category_id: target.category?.id || '',
        start_date: target.start_date || '',
        due_date: target.due_date || '',
        estimated_hours: target.estimated_hours || '',
      })

      const { data: membersData } = await workspacesAPI.listMembers(workspaceId)
      setMembers(membersData?.results || membersData || [])
    } catch (err) {
      setError('Failed to load subtask page data.')
      toast.error('Failed to load subtask page data')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data) => {
    if (!subtask?.id) return

    try {
      const payload = {
        title: (data.title || '').trim(),
        description: stripHtml(data.description),
        status: data.status,
        priority: data.priority,
        assignee_id: data.assignee_id || null,
        category_id: data.category_id || null,
        start_date: data.start_date || null,
        due_date: data.due_date || null,
        estimated_hours: data.estimated_hours || null,
      }

      await updateTask(subtask.id, payload)
      toast.success('Subtask updated')
      navigate(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`)
    } catch (err) {
      toast.error('Failed to update subtask')
    }
  }

  const handleDelete = async () => {
    if (!subtask?.id) return

    try {
      setIsDeleting(true)
      await deleteTask(subtask.id)
      toast.success('Subtask deleted')
      navigate(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`)
    } catch (err) {
      toast.error('Failed to delete subtask')
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  if (error || !subtask || !parentTask || !project) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="text-slate-200">{error || 'Subtask not found'}</div>
          <button
            onClick={() => navigate(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`)}
            className="text-sm text-primary-300 hover:text-primary-200"
          >
            Go back to parent task
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-950">
      <div className="sticky top-0 z-10 bg-surface-900/80 backdrop-blur border-b border-slate-800 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <button
              onClick={() => navigate(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`)}
              className="p-2 hover:bg-surface-800 rounded-lg transition-colors flex-shrink-0"
            >
              <ChevronLeft size={20} className="text-slate-400" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-white truncate">{subtask.title}</h1>
              <p className="text-xs text-slate-400 mt-1">Parent: {parentTask.title}</p>
            </div>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="p-2 text-red-400 hover:bg-red-950/30 rounded-lg transition-colors flex-shrink-0"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-surface-900/50 rounded-xl border border-slate-800 p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label text-sm">Title*</label>
              <input
                className={`input ${errors.title ? 'border-red-500' : ''}`}
                placeholder="Subtask title..."
                {...register('title', { required: 'Title is required' })}
              />
              {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="label text-sm">Description</label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <div className="bg-surface-800 border border-slate-700 rounded-lg overflow-hidden [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-slate-700 [&_.ql-toolbar]:bg-surface-700 [&_.ql-container]:border-none [&_.ql-editor]:min-h-[120px] [&_.ql-editor]:text-sm [&_.ql-editor]:text-slate-200">
                    <ReactQuill
                      theme="snow"
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder="Add description..."
                    />
                  </div>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label text-sm">Status</label>
                <select className="select" {...register('status')}>
                  {TASK_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label text-sm">Priority</label>
                <select className="select" {...register('priority')}>
                  {TASK_PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>{p.icon} {p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label text-sm">Assignee</label>
                <select className="select" {...register('assignee_id')}>
                  <option value="">Unassigned</option>
                  {members.map((member) => (
                    <option key={member.user.id} value={member.user.id}>{member.user.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label text-sm">Category</label>
                <select className="select" {...register('category_id')}>
                  <option value="">No category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label text-sm">Start Date</label>
                <input type="date" className="input" {...register('start_date')} />
              </div>
              <div>
                <label className="label text-sm">Due Date</label>
                <input
                  type="date"
                  className={`input ${errors.due_date ? 'border-red-500' : ''}`}
                  {...register('due_date', {
                    validate: (value) => {
                      if (!value || !startDate) return true
                      return value >= startDate || 'Due date cannot be earlier than start date'
                    },
                  })}
                />
                {errors.due_date && <p className="text-red-400 text-xs mt-1">{errors.due_date.message}</p>}
              </div>
              <div>
                <label className="label text-sm">Est. Hours</label>
                <input type="number" step="0.5" min="0" className="input" placeholder="0" {...register('estimated_hours')} />
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-slate-800">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting} className="flex-1">Save Changes</Button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Subtask?"
        message={`Are you sure you want to delete "${subtask.title}"? This action cannot be undone.`}
        confirmText="Delete Subtask"
        isDanger={true}
        isLoading={isDeleting}
      />
    </div>
  )
}
