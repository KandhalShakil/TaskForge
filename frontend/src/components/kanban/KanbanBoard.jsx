import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import toast from 'react-hot-toast'
import { useTaskStore } from '../../store/taskStore'
import { KANBAN_COLUMNS, TASK_STATUSES } from '../../utils/constants'
import KanbanColumn from './KanbanColumn'
import KanbanCard from './KanbanCard'

export default function KanbanBoard({ tasks = [], project, workspace, onRefresh }) {
  const { bulkUpdateTasks } = useTaskStore()
  const [activeTask, setActiveTask] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Group tasks by status
  const tasksByStatus = KANBAN_COLUMNS.reduce((acc, col) => {
    acc[col.id] = tasks.filter((t) => t.status === col.id)
    return acc
  }, {})

  const findTaskColumn = (taskId) => {
    return KANBAN_COLUMNS.find((col) =>
      tasksByStatus[col.id]?.some((t) => t.id === taskId)
    )?.id
  }

  const handleDragStart = (event) => {
    const { active } = event
    const task = tasks.find((t) => t.id === active.id)
    setActiveTask(task)
  }

  const handleDragOver = (event) => {
    const { active, over } = event
    if (!over) return

    const activeColumn = findTaskColumn(active.id)
    // Determine target column — could be column header or a task in that column
    const overColumn = KANBAN_COLUMNS.find((col) => col.id === over.id)?.id
      || findTaskColumn(over.id)

    if (activeColumn === overColumn) return
    // Optimistic UI update handled in dragEnd
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    setActiveTask(null)
    if (!over) return

    const fromColumn = findTaskColumn(active.id)
    const toColumn = KANBAN_COLUMNS.find((col) => col.id === over.id)?.id
      || findTaskColumn(over.id)

    if (!toColumn || fromColumn === toColumn) return

    // Build bulk update payload
    const updates = [{ id: active.id, status: toColumn }]
    try {
      await bulkUpdateTasks(updates)
      onRefresh?.()
    } catch {
      toast.error('Failed to update task status')
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 h-full">
        {KANBAN_COLUMNS.map((column) => {
          const columnTasks = tasksByStatus[column.id] || []
          return (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={columnTasks}
              project={project}
              workspace={workspace}
              onRefresh={onRefresh}
            />
          )
        })}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="rotate-2 opacity-90">
            <KanbanCard task={activeTask} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
