import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import toast from 'react-hot-toast'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { useTaskStore } from '../../store/taskStore'
import { useProjectStore } from '../../store/projectStore'
import { tasksAPI } from '../../api/tasks'
import { workspacesAPI } from '../../api/workspaces'
import Button from '../../components/common/Button'
import { TASK_PRIORITIES } from '../../utils/constants'
import { stripHtml } from '../../utils/html'
import { extractApiError, validateSubtask } from '../../utils/validation'

export default function CreateSubtaskPage() {
  const navigate = useNavigate()
  const { workspaceId, projectId, taskId } = useParams()
  const { categories } = useTaskStore()
  const { getProjectById, fetchProjectById, setActiveProject } = useProjectStore()

  const [parentTask, setParentTask] = useState(null)
  const [project, setProject] = useState(null)
  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [formError, setFormError] = useState('')

  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    setFocus,
    clearErrors,
    formState: { errors, isSubmitting, isValid },
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      assignee_id: '',
      category_id: '',
      priority: 'no_priority',
      start_date: '',
      due_date: '',
      estimated_hours: '',
    },
  })

  const startDate = watch('start_date')

  useEffect(() => {
    loadData()
  }, [taskId])

  const loadData = async () => {
    try {
      setIsLoading(true)

      if (!workspaceId || !projectId || !taskId) {
        toast.error('Missing route context for subtask creation')
        return
      }

      // Get or fetch project
      let proj = getProjectById(projectId)
      if (!proj) {
        try {
          proj = await fetchProjectById(projectId)
        } catch (err) {
          toast.error('Project not found')
          navigate(`/workspaces/${workspaceId}`)
          return
        }
      }
      setProject(proj)
      setActiveProject(proj)

      let parentNode = null
      try {
        const { data } = await tasksAPI.getTask(taskId)
        parentNode = data
      } catch {
        const { data } = await tasksAPI.getSubtask(taskId)
        parentNode = data
      }

      if (!parentNode) {
        toast.error('Parent task not found')
        navigate(`/workspaces/${workspaceId}/projects/${projectId}/tasks`)
        return
      }

      setParentTask(parentNode)

      const { data: membersData } = await workspacesAPI.listMembers(workspaceId)
      setMembers(membersData?.results || membersData || [])
    } catch (error) {
      toast.error('Error loading data')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data) => {
    setFormError('')
    clearErrors()

    const validation = validateSubtask(data, { parent: parentTask })
    if (!validation.isValid) {
      setFormError(validation.generalError || 'All fields are required')
      Object.entries(validation.errors).forEach(([field, message]) => {
        setError(field, { type: 'manual', message })
      })
      const firstField = Object.keys(validation.errors)[0]
      if (firstField) setFocus(firstField)
      return
    }

    try {
      const payload = {
        title: (data.title || '').trim(),
        description: stripHtml(data.description),
        priority: data.priority,
        assignee_id: data.assignee_id || null,
        category_id: data.category_id || null,
        start_date: data.start_date || null,
        due_date: data.due_date || null,
        estimated_hours: data.estimated_hours || null,
      }

      await tasksAPI.addSubtask(taskId, {
        task: taskId,
        parent_id: null,
        ...payload,
      })
      toast.success('Subtask created')
      navigate(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`)
    } catch (error) {
      const message = extractApiError(error, 'Failed to create subtask')
      setFormError(message)
      toast.error(message)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface-900/80 backdrop-blur border-b border-slate-800 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-surface-800 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-slate-400" />
          </button>
          <h1 className="text-xl font-semibold text-white">Create Subtask</h1>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-surface-900/50 rounded-xl border border-slate-800 p-6">
          {parentTask && (
            <div className="mb-6 p-3 rounded-lg bg-surface-800/50 border border-slate-700">
              <p className="text-xs text-slate-400">Parent Task</p>
              <p className="text-sm font-medium text-white mt-1">{parentTask.title}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {formError && (
              <div className="rounded-lg border border-red-700/50 bg-red-950/40 px-3 py-2 text-xs text-red-200">
                {formError}
              </div>
            )}
            {/* Title */}
            <div>
              <label className="label text-sm">Title *</label>
              <input
                className={`input ${errors.title ? 'border-red-500' : ''}`}
                placeholder="Subtask title..."
                {...register('title', { required: 'Title is required' })}
              />
              {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="label text-sm">Description</label>
              <Controller
                name="description"
                control={control}
                rules={{ required: 'Description is required' }}
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
              {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
            </div>

            {/* Priority & Assignee */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label text-sm">Priority</label>
                <select className={`select ${errors.priority ? 'border-red-500' : ''}`} {...register('priority', { required: 'Priority is required' })}>
                  {TASK_PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.icon} {p.label}
                    </option>
                  ))}
                </select>
                {errors.priority && <p className="text-red-400 text-xs mt-1">{errors.priority.message}</p>}
              </div>
              <div>
                <label className="label text-sm">Assignee</label>
                <select className={`select ${errors.assignee_id ? 'border-red-500' : ''}`} {...register('assignee_id', { required: 'Assignee is required' })}>
                  <option value="">Unassigned</option>
                  {members.map((member) => (
                    <option key={member.user.id} value={member.user.id}>
                      {member.user.full_name}
                    </option>
                  ))}
                </select>
                {errors.assignee_id && <p className="text-red-400 text-xs mt-1">{errors.assignee_id.message}</p>}
              </div>
            </div>

            {/* Category & Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label text-sm">Category</label>
                <select className="select" {...register('category_id')}>
                  <option value="">No category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label text-sm">Est. Hours</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  className={`input ${errors.estimated_hours ? 'border-red-500' : ''}`}
                  placeholder="0"
                  {...register('estimated_hours', {
                    required: 'Estimated hours is required',
                    validate: (value) => {
                      const parsed = Number(value)
                      return Number.isFinite(parsed) && parsed > 0 || 'Estimated hours must be a positive number'
                    },
                  })}
                />
                {errors.estimated_hours && <p className="text-red-400 text-xs mt-1">{errors.estimated_hours.message}</p>}
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label text-sm">Start Date</label>
                <input type="date" className={`input ${errors.start_date ? 'border-red-500' : ''}`} {...register('start_date', { required: 'Start date is required' })} />
                {errors.start_date && <p className="text-red-400 text-xs mt-1">{errors.start_date.message}</p>}
              </div>
              <div>
                <label className="label text-sm">Due Date</label>
                <input
                  type="date"
                  className={`input ${errors.due_date ? 'border-red-500' : ''}`}
                  {...register('due_date', {
                    required: 'End date is required',
                    validate: (value) => {
                      if (!value || !startDate) return true
                      return value >= startDate || 'End date cannot be before start date'
                    },
                  })}
                />
                {errors.due_date && <p className="text-red-400 text-xs mt-1">{errors.due_date.message}</p>}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-slate-800">
              <Button type="button" variant="secondary" onClick={() => navigate(-1)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting} disabled={!isValid} className="flex-1">
                Create Subtask
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
