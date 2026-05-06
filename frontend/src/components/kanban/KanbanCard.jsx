import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, User, GripVertical, Edit2, MessageSquare, CheckCircle2 } from 'lucide-react'
import { formatDueDate, isOverdue } from '../../utils/dateUtils'
import { TASK_PRIORITIES } from '../../utils/constants'
import TaskModal from '../tasks/TaskModal'
import { motion } from 'framer-motion'

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
      <motion.div
        layout
        ref={setNodeRef}
        style={style}
        className={`bg-slate-900/60 border rounded-2xl p-4 group cursor-default select-none hover:bg-slate-900/80 hover:border-white/10 transition-all duration-200 backdrop-blur-sm relative ${
          isDragging ? 'border-primary-500/50 shadow-2xl shadow-primary-500/20 scale-105 z-50' : 'border-white/5 shadow-lg'
        }`}
      >
        {/* Top Section: Category & Actions */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 rounded-lg bg-slate-800/50 text-slate-600 hover:text-slate-400 transition-colors"
            >
              <GripVertical size={12} />
            </div>
            {task.category && (
              <span
                className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border"
                style={{ backgroundColor: task.category.color + '10', borderColor: task.category.color + '30', color: task.category.color }}
              >
                {task.category.name}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
            <button
              onClick={() => setShowEdit(true)}
              className="p-1.5 rounded-lg bg-slate-800/50 text-slate-500 hover:text-white transition-all"
            >
              <Edit2 size={12} />
            </button>
          </div>
        </div>

        {/* Task Title */}
        <h4
          className={`text-sm font-bold leading-relaxed mb-4 cursor-pointer hover:text-primary-400 transition-colors line-clamp-2 ${
            task.status === 'done' ? 'text-slate-600 line-through' : 'text-slate-200'
          }`}
          onClick={() => setShowEdit(true)}
        >
          {task.title}
        </h4>

        {/* Middle Section: Indicators */}
        <div className="flex items-center gap-3 mb-5">
          {priority && task.priority !== 'no_priority' && (
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${priority.color}`}>
              {priority.icon} {priority.label}
            </div>
          )}
          {task.status === 'done' && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-green-500 uppercase tracking-widest">
              <CheckCircle2 size={12} /> Completed
            </div>
          )}
        </div>

        {/* Footer: User & Date */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          {task.assignee ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-[9px] font-black text-white shadow-inner">
                {task.assignee.initials}
              </div>
              <span className="text-[10px] font-bold text-slate-500 truncate max-w-[60px] uppercase tracking-wider">{task.assignee.full_name.split(' ')[0]}</span>
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-slate-700">
              <User size={12} />
            </div>
          )}

          {task.due_date && (
            <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider ${overdue ? 'text-red-400' : 'text-slate-500'}`}>
              <Calendar size={12} />
              {formatDueDate(task.due_date)}
            </div>
          )}
        </div>
      </motion.div>

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
