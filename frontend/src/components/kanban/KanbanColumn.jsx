import { useState } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { Plus, MoreHorizontal } from 'lucide-react'
import KanbanCard from './KanbanCard'
import TaskModal from '../tasks/TaskModal'
import { useAuthStore } from '../../store/authStore'
import { useWorkspaceStore } from '../../store/workspaceStore'

const COLUMN_HEADER_COLORS = {
  todo: 'text-slate-400',
  in_progress: 'text-primary-400',
  in_review: 'text-amber-400',
  done: 'text-emerald-400',
  cancelled: 'text-rose-400',
}

const COLUMN_DOT_COLORS = {
  todo: 'bg-slate-600',
  in_progress: 'bg-primary-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]',
  in_review: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]',
  done: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
  cancelled: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]',
}

export default function KanbanColumn({ column, tasks, project, workspace, onRefresh, onCreateTask }) {
  const { user } = useAuthStore()
  const { getUserRole } = useWorkspaceStore()
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  const userRole = getUserRole(user?.id)
  const isViewer = userRole === 'viewer'

  return (
    <div className="flex-shrink-0 w-[300px] flex flex-col h-full font-['Outfit']">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-5 px-2">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${COLUMN_DOT_COLORS[column.id]}`} />
          <h3 className={`text-xs font-black uppercase tracking-[0.15em] ${COLUMN_HEADER_COLORS[column.id]}`}>
            {column.label}
          </h3>
          <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-slate-900 border border-white/5 text-[10px] font-black text-slate-500 shadow-inner">
            {tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {!isViewer && (
            <button
              onClick={onCreateTask}
              className="p-1.5 rounded-lg bg-slate-900/50 text-slate-500 hover:text-white hover:bg-slate-800 transition-all border border-white/5"
            >
              <Plus size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Drop Zone / Tasks Container */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[500px] rounded-2xl transition-all duration-300 p-2.5 space-y-3 ${
          isOver
            ? 'bg-primary-500/10 ring-2 ring-primary-500/50 shadow-2xl shadow-primary-500/20'
            : 'bg-slate-900/20 border border-white/5'
        }`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} project={project} workspace={workspace} onRefresh={onRefresh} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div
            className={`flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-2xl transition-all duration-500 group/drop relative overflow-hidden ${
              isOver ? 'border-primary-500 bg-primary-500/5' : 'border-white/5 hover:border-white/10'
            } ${!isViewer ? 'cursor-pointer' : ''}`}
            onClick={!isViewer ? onCreateTask : undefined}
          >
            <div className={`w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-slate-700 mb-4 group-hover/drop:scale-110 group-hover/drop:text-slate-500 transition-all border border-white/5 shadow-inner ${isOver ? 'text-primary-400 border-primary-500/30' : ''}`}>
              <Plus size={20} />
            </div>
            <div className="text-center">
              <span className={`block text-[10px] font-black uppercase tracking-widest mb-1 transition-colors ${isOver ? 'text-primary-400' : 'text-slate-600 group-hover/drop:text-slate-500'}`}>
                {!isViewer ? 'Drop Task Here' : 'Empty Column'}
              </span>
              <p className="text-[9px] font-bold text-slate-700 uppercase tracking-tighter">
                {!isViewer ? 'or click to create' : 'No items found'}
              </p>
            </div>
            {isOver && (
              <div className="absolute inset-0 bg-primary-500/5 animate-pulse pointer-events-none" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
