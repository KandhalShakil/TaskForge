import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MoreHorizontal, Edit2, Trash2, Calendar, User, Eye, FileText, Plus, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useTaskStore } from '../../store/taskStore'
import { useProjectStore } from '../../store/projectStore'
import { TASK_STATUSES, TASK_PRIORITIES } from '../../utils/constants'
import { formatDueDate, isOverdue } from '../../utils/dateUtils'
import { useAuthStore } from '../../store/authStore'
import { useWorkspaceStore } from '../../store/workspaceStore'
import ConfirmModal from '../common/ConfirmModal'
import Button from '../common/Button'

const StatusBadge = ({ status }) => {
  const s = TASK_STATUSES.find((x) => x.value === status)
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${s?.color || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
      {s?.label || status}
    </span>
  )
}

const PriorityBadge = ({ priority }) => {
  const p = TASK_PRIORITIES.find((x) => x.value === priority)
  if (priority === 'no_priority') return <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">—</span>
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${p?.color || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
      {p?.icon} {p?.label}
    </span>
  )
}

export default function TaskListView({ tasks = [], project, workspace, onRefresh, onCreateTask, getTaskPath }) {
  const navigate = useNavigate()
  const { deleteTask } = useTaskStore()
  const { setActiveProject } = useProjectStore()
  const { user } = useAuthStore()
  const { getUserRole } = useWorkspaceStore()
  const [taskToDelete, setTaskToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const userRole = getUserRole(user?.id)
  const isViewer = userRole === 'viewer'

  const handleNavigateToTask = (task) => {
    if (project) setActiveProject(project)
    const taskPath = getTaskPath ? getTaskPath(task) : `/workspaces/${workspace.id}/projects/${project.id}/tasks/${task.id}`
    navigate(taskPath)
  }

  const handleDelete = async () => {
    if (!taskToDelete) return
    setIsDeleting(true)
    try {
      await deleteTask(taskToDelete.id)
      toast.success('Task removed')
      setTaskToDelete(null)
      onRefresh?.()
    } catch {
      toast.error('Deletion failed')
    } finally {
      setIsDeleting(false)
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="card p-20 text-center flex flex-col items-center justify-center border-dashed border-white/5 bg-transparent">
        <div className="w-20 h-20 rounded-3xl bg-slate-900 flex items-center justify-center mb-6 border border-white/5">
          <FileText size={40} className="text-slate-700" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No tasks found</h3>
        <p className="text-sm text-slate-500 max-w-xs mx-auto mb-8">
          This project view is currently empty. Create a task to start tracking progress.
        </p>
        {!isViewer && (
          <Button onClick={onCreateTask} icon={Plus} size="lg">
            Create Task
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* List Container */}
      <div className="bg-slate-900/20 rounded-2xl border border-white/5 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_auto] md:grid-cols-[1.5fr_100px_120px_140px_120px_60px] gap-4 px-6 py-4 bg-slate-900/40 border-b border-white/5">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Task Title</span>
          <span className="hidden md:block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Status</span>
          <span className="hidden lg:block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Priority</span>
          <span className="hidden xl:block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Assignee</span>
          <span className="hidden sm:block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right md:text-left">Due Date</span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500"></span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-white/5">
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => {
              const overdue = isOverdue(task.due_date, task.status)
              return (
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={task.id}
                    className="grid grid-cols-[1fr_auto] md:grid-cols-[1.5fr_100px_120px_140px_120px_60px] gap-4 px-4 sm:px-6 py-4 items-center hover:bg-white/[0.02] transition-all group"
                  >
                    {/* Title */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 shadow-sm ${
                        task.status === 'done' ? 'bg-green-500/50'
                        : task.status === 'in_progress' ? 'bg-primary-500'
                        : task.status === 'cancelled' ? 'bg-red-500/50'
                        : 'bg-slate-600'
                      }`} />
                      <div className="min-w-0">
                        <span
                          onClick={() => handleNavigateToTask(task)}
                          className={`text-sm font-bold truncate cursor-pointer block hover:text-primary-400 transition-colors ${
                            task.status === 'done' ? 'text-slate-600 line-through' : 'text-slate-200'
                          }`}
                        >
                          {task.title}
                        </span>
                        {task.category && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] md:text-[9px] font-black uppercase tracking-tighter border mt-1 inline-block"
                            style={{ backgroundColor: task.category.color + '10', borderColor: task.category.color + '30', color: task.category.color }}>
                            {task.category.name}
                          </span>
                        )}
                        {/* Mobile Status Indicator */}
                        <div className="md:hidden mt-1.5 flex items-center gap-2">
                          <StatusBadge status={task.status} />
                          {task.due_date && (
                             <span className={`text-[10px] font-bold ${overdue ? 'text-red-400' : 'text-slate-500'}`}>
                               · {formatDueDate(task.due_date)}
                             </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status (Desktop) */}
                    <div className="hidden md:flex justify-start">
                      <StatusBadge status={task.status} />
                    </div>

                    {/* Priority (Desktop) */}
                    <div className="hidden lg:flex justify-start">
                      <PriorityBadge priority={task.priority} />
                    </div>

                    {/* Assignee (Desktop) */}
                    <div className="hidden xl:block min-w-0">
                      {task.assignee ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-[10px] font-black text-white shadow-sm">
                            {task.assignee.initials}
                          </div>
                          <span className="text-xs font-medium text-slate-400 truncate">{task.assignee.full_name.split(' ')[0]}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest italic">—</span>
                      )}
                    </div>

                    {/* Date (Desktop) */}
                    <div className="hidden sm:block min-w-0">
                      {task.due_date ? (
                        <div className={`flex items-center gap-1.5 text-xs font-bold ${overdue ? 'text-red-400' : 'text-slate-500'}`}>
                          <Calendar size={12} className={overdue ? 'text-red-500' : 'text-slate-600'} />
                          {formatDueDate(task.due_date)}
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">—</span>
                      )}
                    </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => handleNavigateToTask(task)}
                      className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                    >
                      {isViewer ? <Eye size={14} /> : <Edit2 size={14} />}
                    </button>
                    {!isViewer && (
                      <button
                        onClick={() => setTaskToDelete(task)}
                        className="p-1.5 rounded-lg bg-red-500/5 hover:bg-red-500/20 text-red-500/50 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleDelete}
        title="Remove Task"
        message={`Are you sure you want to delete "${taskToDelete?.title}"? This action is permanent.`}
        confirmText="Remove Task"
        isDanger={true}
        isLoading={isDeleting}
      />
    </div>
  )
}
