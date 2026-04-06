import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, User, GripVertical, Edit2 } from 'lucide-react'
import { formatDueDate, isOverdue } from '../../utils/dateUtils'
import { TASK_PRIORITIES } from '../../utils/constants'
import TaskModal from '../tasks/TaskModal'

export default function KanbanCard({ task, project, workspace, onRefresh, isDragging = false }) {
  const [showEdit, setShowEdit] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  }

  const priority = TASK_PRIORITIES.find((p) => p.value === task.priority)
  const overdue = isOverdue(task.due_date, task.status)

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`bg-surface-900 border rounded-lg p-3 group cursor-default select-none hover:border-slate-600 transition-all duration-150 ${
          isDragging ? 'border-primary-500 shadow-lg shadow-primary-900/30' : 'border-slate-800'
        }`}
      >
        {/* Drag handle + priority */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-0.5 rounded text-slate-700 hover:text-slate-500 transition-colors"
            >
              <GripVertical size={12} />
            </div>
            {priority && task.priority !== 'no_priority' && (
              <span className="text-sm">{priority.icon}</span>
            )}
          </div>
          <button
            onClick={() => setShowEdit(true)}
            className="p-1 rounded text-slate-600 hover:text-slate-300 hover:bg-surface-700 opacity-0 group-hover:opacity-100 transition-all"
          >
            <Edit2 size={11} />
          </button>
        </div>

        {/* Task title */}
        <p
          className={`text-sm font-medium leading-snug mb-2 cursor-pointer hover:text-primary-300 transition-colors ${
            task.status === 'done' ? 'line-through text-slate-500' : 'text-slate-100'
          }`}
          onClick={() => setShowEdit(true)}
        >
          {task.title}
        </p>

        {/* Category tag */}
        {task.category && (
          <span
            className="badge text-xs px-1.5 py-0.5 mb-2 block w-fit"
            style={{ background: task.category.color + '30', color: task.category.color }}
          >
            {task.category.name}
          </span>
        )}

        {/* Footer: assignee + due date */}
        <div className="flex items-center justify-between mt-2">
          {task.assignee ? (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                {task.assignee.initials}
              </div>
              <span className="text-xs text-slate-500 truncate max-w-[80px]">{task.assignee.full_name}</span>
            </div>
          ) : (
            <span className="text-xs text-slate-700 flex items-center gap-1"><User size={10} /> None</span>
          )}

          {task.due_date && (
            <span className={`text-xs flex items-center gap-1 ${overdue ? 'text-red-400' : 'text-slate-500'}`}>
              <Calendar size={10} />
              {formatDueDate(task.due_date)}
            </span>
          )}
        </div>
      </div>

      {showEdit && (
        <TaskModal
          task={task}
          project={project}
          workspace={workspace}
          onClose={() => { setShowEdit(false); onRefresh?.() }}
        />
      )}
    </>
  )
}
