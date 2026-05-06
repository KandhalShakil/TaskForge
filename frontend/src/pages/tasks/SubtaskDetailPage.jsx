import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Trash2, User, Tag, Flag, AlignLeft } from 'lucide-react'
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
import SelectionList from '../../components/common/SelectionList'
import AdvancedDatePicker from '../../components/common/AdvancedDatePicker'
import SegmentedControl from '../../components/common/SegmentedControl'
import { TASK_STATUSES, TASK_PRIORITIES } from '../../utils/constants'
import { stripHtml } from '../../utils/html'
import { extractApiError, validateSubtask } from '../../utils/validation'

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
  const [pageError, setPageError] = useState('')
  const [formError, setFormError] = useState('')

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting, isValid },
  } = useForm()

  const startDate = watch('start_date')

  useEffect(() => {
    loadData()
  }, [workspaceId, projectId, taskId, subtaskId])

  const loadData = async () => {
    try {
      setIsLoading(true)
      let proj = getProjectById(projectId)
      if (!proj) proj = await fetchProjectById(projectId)
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
      setPageError('Access Denied or System Failure.')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data) => {
    if (!subtask?.id) return
    setFormError('')
    clearErrors()
    const validation = validateSubtask(data, { parent: parentTask })
    if (!validation.isValid) {
      setFormError(validation.generalError || 'Invalid configuration')
      return
    }

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
      toast.success('System parameters updated')
      navigate(-1)
    } catch (err) {
      setFormError(extractApiError(err, 'Update failed'))
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await deleteTask(subtask.id)
      toast.success('Entity purged')
      navigate(-1)
    } catch (err) {
      toast.error('Purge failed')
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  if (isLoading) return <div className="min-h-screen bg-[#0b0c10] flex items-center justify-center text-slate-500 font-black uppercase tracking-widest text-xs">Syncing Data Streams...</div>

  if (pageError || !subtask) return <div className="min-h-screen bg-[#0b0c10] flex items-center justify-center p-6 text-rose-500 font-black uppercase tracking-widest text-xs">{pageError || 'Entity not found'}</div>

  return (
    <div className="min-h-screen bg-[#0b0c10] pb-20">
      <div className="sticky top-0 z-10 bg-[#0b0c10]/80 backdrop-blur-xl border-b border-white/5 px-8 py-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate(-1)} className="p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all">
              <ChevronLeft size={20} className="text-slate-400" />
            </button>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter text-white truncate max-w-[300px]">{subtask.title}</h1>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Parent Entity: {parentTask?.title}</p>
            </div>
          </div>
          <button onClick={() => setShowDeleteModal(true)} className="p-3 text-rose-500 bg-rose-500/5 border border-rose-500/10 rounded-2xl hover:bg-rose-500/10 transition-all">
            <Trash2 size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 bg-[#12141a]/40 border border-white/5 rounded-[2.5rem] p-10 backdrop-blur-xl">
          {formError && <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[11px] font-black uppercase tracking-widest">{formError}</div>}
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 block opacity-70">Entity Designation</label>
            <input
              className={`w-full rounded-2xl h-14 px-6 text-[15px] font-bold bg-[#12141a]/60 border border-white/5 text-white focus:border-primary-500/50 outline-none transition-all ${errors.title ? 'border-rose-500/50' : ''}`}
              {...register('title', { required: 'Required' })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 block opacity-70">Functional Overview</label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <div className="bg-[#12141a]/60 border border-white/5 rounded-2xl overflow-hidden [&_.ql-toolbar]:bg-white/5 [&_.ql-toolbar]:border-none [&_.ql-container]:border-none [&_.ql-editor]:min-h-[180px] [&_.ql-editor]:text-slate-300">
                  <ReactQuill theme="snow" value={field.value || ''} onChange={field.onChange} />
                </div>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-8">
            <Controller name="status" control={control} render={({ field }) => <SegmentedControl label="Execution State" options={TASK_STATUSES} value={field.value} onChange={field.onChange} />} />
            <Controller name="priority" control={control} render={({ field }) => <SegmentedControl label="Mission Priority" options={TASK_PRIORITIES} value={field.value} onChange={field.onChange} />} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <Controller
              name="assignee_id"
              control={control}
              render={({ field }) => (
                <SelectionList
                  label="Assigned Personnel"
                  options={members.map(m => ({ id: m.user.id, name: m.user.full_name, icon: <User size={14} /> }))}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              name="category_id"
              control={control}
              render={({ field }) => (
                <SelectionList
                  label="Protocol Classification"
                  options={categories.map(c => ({ id: c.id, name: c.name, icon: <Tag size={14} /> }))}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <Controller name="start_date" control={control} render={({ field }) => <AdvancedDatePicker label="Kickoff" value={field.value} onChange={field.onChange} />} />
            <Controller name="due_date" control={control} render={({ field }) => <AdvancedDatePicker label="Final Deadline" value={field.value} onChange={field.onChange} />} />
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 block opacity-70">Resource Allocation (Hrs)</label>
              <input
                type="number" step="0.5"
                className="w-full rounded-2xl h-14 px-6 text-[15px] font-bold bg-[#12141a]/60 border border-white/5 text-white outline-none focus:border-primary-500/50 transition-all"
                {...register('estimated_hours')}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <Button type="button" variant="ghost" onClick={() => navigate(-1)} className="flex-1 h-14 rounded-2xl uppercase tracking-widest text-[11px] font-black">Cancel Sync</Button>
            <Button type="submit" loading={isSubmitting} disabled={!isValid} className="flex-[2] h-14 rounded-2xl uppercase tracking-widest text-[11px] font-black shadow-lg shadow-primary-500/10">Commit Updates</Button>
          </div>
        </form>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Purge Entity?"
        message={`Warning: You are about to permanently delete "${subtask.title}". This action will terminate this data stream and all associated sub-processes.`}
        confirmText="Confirm Purge"
        isDanger={true}
        isLoading={isDeleting}
      />
    </div>
  )
}
