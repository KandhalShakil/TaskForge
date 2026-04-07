import { useState } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import KanbanCard from './KanbanCard'
import TaskModal from '../tasks/TaskModal'
import { useAuthStore } from '../../store/authStore'
import { useWorkspaceStore } from '../../store/workspaceStore'

const COLUMN_COLORS = {
  todo: 'border-slate-700',
  in_progress: 'border-blue-800/50',
  in_review: 'border-yellow-800/50',
  done: 'border-green-800/50',
  cancelled: 'border-red-800/50',
}

const COLUMN_HEADER_COLORS = {
  todo: 'text-slate-400',
  in_progress: 'text-blue-400',
  in_review: 'text-yellow-400',
  done: 'text-green-400',
  cancelled: 'text-red-400',
}

const COLUMN_DOT_COLORS = {
  todo: 'bg-slate-500',
  in_progress: 'bg-blue-500',
  in_review: 'bg-yellow-500',
  done: 'bg-green-500',
  cancelled: 'bg-red-500',
}

export default function KanbanColumn({ column, tasks, project, workspace, onRefresh, onCreateTask }) {
  const { user } = useAuthStore()
  const { getUserRole } = useWorkspaceStore()
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  const userRole = getUserRole(user?.id)
  const isViewer = userRole === 'viewer'

  return (
    <>
      <div className="flex-shrink-0 w-72">
        {/* Column header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${COLUMN_DOT_COLORS[column.id]}`} />
            <span className={`text-sm font-semibold uppercase tracking-wide ${COLUMN_HEADER_COLORS[column.id]}`}>
              {column.label}
            </span>
            <span className="text-xs bg-surface-800 text-slate-500 px-1.5 py-0.5 rounded-full font-medium">
              {tasks.length}
            </span>
          </div>
          {!isViewer && (
            <button
              onClick={onCreateTask}
              className="p-1 rounded text-slate-600 hover:text-slate-300 hover:bg-surface-800 transition-all"
            >
              <Plus size={14} />
            </button>
          )}
        </div>

        {/* Drop zone */}
        <div
          ref={setNodeRef}
          className={`min-h-[500px] rounded-xl border transition-all duration-200 p-2 space-y-2 ${
            isOver
              ? 'border-primary-600 bg-primary-950/20'
              : `${COLUMN_COLORS[column.id]} bg-surface-900/50`
          }`}
        >
          <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <KanbanCard key={task.id} task={task} project={project} workspace={workspace} onRefresh={onRefresh} />
            ))}
          </SortableContext>

          {tasks.length === 0 && (
            <div
              className={`flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl transition-all duration-300 group/drop ${
                isOver ? 'border-primary-500 bg-primary-500/5' : 'border-slate-800 hover:border-slate-700'
              } ${!isViewer ? 'cursor-pointer' : ''}`}
              onClick={!isViewer ? onCreateTask : undefined}
            >
              <div className={`p-2 rounded-lg bg-surface-900 border border-slate-800 text-slate-600 mb-2 group-hover/drop:text-slate-400 group-hover/drop:scale-110 transition-all ${isOver ? 'text-primary-400 border-primary-500/30' : ''}`}>
                <Plus size={16} />
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${isOver ? 'text-primary-400' : 'text-slate-600 group-hover/drop:text-slate-500'}`}>
                {!isViewer ? 'Add or Drop Task' : 'No Tasks'}
              </span>
            </div>
          )}
        </div>
      </div>

    </>
  )
}
