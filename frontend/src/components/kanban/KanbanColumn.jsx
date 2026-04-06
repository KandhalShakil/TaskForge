import { useState } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import KanbanCard from './KanbanCard'
import TaskModal from '../tasks/TaskModal'

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

export default function KanbanColumn({ column, tasks, project, workspace, onRefresh }) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

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
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-1 rounded text-slate-600 hover:text-slate-300 hover:bg-surface-800 transition-all"
          >
            <Plus size={14} />
          </button>
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
              className="flex items-center justify-center h-24 border-2 border-dashed border-slate-800 rounded-lg cursor-pointer hover:border-slate-600 transition-colors"
              onClick={() => setShowCreateModal(true)}
            >
              <span className="text-xs text-slate-600">Drop tasks here</span>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <TaskModal
          project={project}
          workspace={workspace}
          task={null}
          onClose={() => { setShowCreateModal(false); onRefresh?.() }}
        />
      )}
    </>
  )
}
