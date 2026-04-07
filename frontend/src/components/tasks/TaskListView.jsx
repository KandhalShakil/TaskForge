import { useState } from 'react'
import { MoreHorizontal, Edit2, Trash2, Calendar, User, Eye, FileText, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTaskStore } from '../../store/taskStore'
import { TASK_STATUSES, TASK_PRIORITIES } from '../../utils/constants'
import { formatDueDate, isOverdue } from '../../utils/dateUtils'
import TaskModal from './TaskModal'
import { useAuthStore } from '../../store/authStore'
import { useWorkspaceStore } from '../../store/workspaceStore'
import ConfirmModal from '../common/ConfirmModal'

const StatusBadge = ({ status }) => {
  const s = TASK_STATUSES.find((x) => x.value === status)
  return (
    <span className={`badge text-xs px-2 py-0.5 ${s?.color || ''}`}>
      {s?.label || status}
    </span>
  )
}

const PriorityBadge = ({ priority }) => {
  const p = TASK_PRIORITIES.find((x) => x.value === priority)
  if (priority === 'no_priority') return null
  return (
    <span className={`badge text-xs px-2 py-0.5 flex items-center gap-1 ${p?.color || ''}`}>
      {p?.icon} {p?.label}
    </span>
  )
}

export default function TaskListView({ tasks = [], project, workspace, onRefresh }) {
  const { deleteTask } = useTaskStore()
  const { user } = useAuthStore()
  const { getUserRole } = useWorkspaceStore()
  const [editingTask, setEditingTask] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const userRole = getUserRole(user?.id)
  const isViewer = userRole === 'viewer'

  const handleDelete = async () => {
    if (!taskToDelete) return
    setIsDeleting(true)
    try {
      await deleteTask(taskToDelete.id)
      toast.success('Task deleted')
      setTaskToDelete(null)
      onRefresh?.()
    } catch {
      toast.error('Failed to delete task')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="rounded-xl border border-slate-800 overflow-hidden">
        {/* Table header */}
        <div className="bg-surface-900 grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-4 py-3 border-b border-slate-800">
          <span className="table-header px-0">Title</span>
          <span className="table-header px-0">Status</span>
          <span className="table-header px-0">Priority</span>
          <span className="table-header px-0">Assignee</span>
          <span className="table-header px-0">Due Date</span>
          <span className="table-header px-0"></span>
        </div>

        {/* Task rows */}
        <div className="divide-y divide-slate-800/50 bg-surface-950">
          {tasks.length === 0 ? (
            <div className="py-24 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-900 border border-slate-800 flex items-center justify-center mb-4 text-slate-600 shadow-inner">
                <FileText size={32} />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">No tasks found</h3>
              <p className="text-slate-500 text-sm max-w-xs mx-auto">
                There are no tasks in this project yet. Start by creating a new task to track your progress.
              </p>
              {!isViewer && (
                <button 
                  onClick={() => setShowCreate(true)}
                  className="btn-primary mt-6 shadow-lg shadow-primary-900/20"
                >
                  <Plus size={16} /> Create Task
                </button>
              )}
            </div>
          ) : (
            tasks.map((task) => {
              const overdue = isOverdue(task.due_date, task.status)
              return (
                <div
                  key={task.id}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-4 py-3 items-center hover:bg-surface-900/50 transition-colors group"
                >
                  {/* Title */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        task.status === 'done' ? 'bg-green-500'
                        : task.status === 'in_progress' ? 'bg-blue-500'
                        : task.status === 'cancelled' ? 'bg-red-500'
                        : 'bg-slate-600'
                      }`}
                    />
                    <span
                      className={`text-sm font-medium truncate cursor-pointer hover:text-primary-300 transition-colors ${
                        task.status === 'done' ? 'line-through text-slate-500' : 'text-slate-100'
                      }`}
                      onClick={() => setEditingTask(task)}
                    >
                      {task.title}
                    </span>
                    {task.category && (
                      <span className="badge text-xs px-1.5 py-0.5 flex-shrink-0"
                        style={{ background: task.category.color + '30', color: task.category.color }}>
                        {task.category.name}
                      </span>
                    )}
                  </div>

                  {/* Status */}
                  <StatusBadge status={task.status} />

                  {/* Priority */}
                  <PriorityBadge priority={task.priority} />

                  {/* Assignee */}
                  <div>
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {task.assignee.initials}
                        </div>
                        <span className="text-xs text-slate-400 truncate">{task.assignee.full_name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-600 flex items-center gap-1">
                        <User size={11} /> Unassigned
                      </span>
                    )}
                  </div>

                  {/* Due date */}
                  <div>
                    {task.due_date ? (
                      <span className={`text-xs flex items-center gap-1 ${overdue ? 'text-red-400' : 'text-slate-400'}`}>
                        <Calendar size={11} />
                        {formatDueDate(task.due_date)}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingTask(task)}
                      className="p-1.5 rounded text-slate-500 hover:text-slate-200 hover:bg-surface-700 transition-all"
                      title={isViewer ? 'View Task' : 'Edit Task'}
                    >
                      {isViewer ? <Eye size={13} /> : <Edit2 size={13} />}
                    </button>
                    {!isViewer && (
                      <button
                        onClick={() => setTaskToDelete(task)}
                        className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-all font-bold"
                        title="Delete Task"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {editingTask && (
        <TaskModal
          task={editingTask}
          project={project}
          workspace={workspace}
          onClose={() => { setEditingTask(null); onRefresh?.() }}
        />
      )}

      <ConfirmModal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Task?"
        message={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete Task"
        isDanger={true}
        isLoading={isDeleting}
      />
    </>
  )
}
