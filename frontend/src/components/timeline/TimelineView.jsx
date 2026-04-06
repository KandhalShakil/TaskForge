import { useState, useMemo } from 'react'
import { parseISO, differenceInDays, format, startOfMonth, endOfMonth, addMonths, subMonths, isValid } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import TaskModal from '../tasks/TaskModal'

const STATUS_COLORS = {
  todo: '#475569',
  in_progress: '#3b82f6',
  in_review: '#eab308',
  done: '#22c55e',
  cancelled: '#ef4444',
}

const DAYS_TO_SHOW = 30

export default function TimelineView({ tasks = [], project, workspace, onRefresh }) {
  const [viewStart, setViewStart] = useState(startOfMonth(new Date()))
  const [editingTask, setEditingTask] = useState(null)

  const viewEnd = new Date(viewStart)
  viewEnd.setDate(viewStart.getDate() + DAYS_TO_SHOW)

  const days = Array.from({ length: DAYS_TO_SHOW }, (_, i) => {
    const d = new Date(viewStart)
    d.setDate(viewStart.getDate() + i)
    return d
  })

  const tasksWithDates = useMemo(() => {
    return tasks.filter((t) => t.due_date || t.start_date)
  }, [tasks])

  const getTaskBar = (task) => {
    let start = task.start_date ? parseISO(task.start_date) : (task.due_date ? parseISO(task.due_date) : null)
    let end = task.due_date ? parseISO(task.due_date) : start

    if (!start || !isValid(start)) return null

    const startOffset = differenceInDays(start, viewStart)
    const duration = differenceInDays(end, start) + 1

    if (startOffset >= DAYS_TO_SHOW || startOffset + duration < 0) return null

    const clampedStart = Math.max(0, startOffset)
    const clampedDuration = Math.min(duration - (clampedStart - startOffset), DAYS_TO_SHOW - clampedStart)

    return {
      left: `${(clampedStart / DAYS_TO_SHOW) * 100}%`,
      width: `${(Math.max(1, clampedDuration) / DAYS_TO_SHOW) * 100}%`,
    }
  }

  const today = new Date()
  const todayOffset = differenceInDays(today, viewStart)
  const todayPct = (todayOffset / DAYS_TO_SHOW) * 100

  return (
    <>
      <div className="card overflow-hidden">
        {/* Navigation */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewStart((d) => { const nd = new Date(d); nd.setDate(d.getDate() - 7); return nd })}
              className="btn-ghost p-1.5"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-white">
              {format(viewStart, 'MMM d')} – {format(viewEnd, 'MMM d, yyyy')}
            </span>
            <button
              onClick={() => setViewStart((d) => { const nd = new Date(d); nd.setDate(d.getDate() + 7); return nd })}
              className="btn-ghost p-1.5"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <button
            onClick={() => setViewStart(startOfMonth(new Date()))}
            className="btn-ghost text-xs px-3"
          >
            Today
          </button>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Day headers */}
            <div className="flex border-b border-slate-800 bg-surface-900">
              <div className="w-48 flex-shrink-0 px-4 py-2 text-xs font-medium text-slate-500">Task</div>
              <div className="flex-1 flex relative">
                {days.map((day, i) => {
                  const isToday = differenceInDays(day, today) === 0
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6
                  return (
                    <div
                      key={i}
                      className={`flex-1 text-center py-2 text-xs border-l border-slate-800 ${
                        isToday ? 'text-primary-400 font-semibold bg-primary-950/20' : isWeekend ? 'text-slate-600' : 'text-slate-500'
                      }`}
                    >
                      <div>{format(day, 'd')}</div>
                      <div className="text-xs opacity-70">{format(day, 'EEE')}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Task rows */}
            <div className="divide-y divide-slate-800/50">
              {tasksWithDates.length === 0 ? (
                <div className="py-12 text-center">
                  <Calendar size={24} className="mx-auto text-slate-600 mb-2" />
                  <p className="text-slate-500 text-sm">No tasks with dates found</p>
                  <p className="text-slate-600 text-xs mt-1">Add due dates or start dates to tasks to see them here</p>
                </div>
              ) : (
                tasksWithDates.map((task) => {
                  const bar = getTaskBar(task)
                  return (
                    <div key={task.id} className="flex items-center hover:bg-surface-900/50 transition-colors group">
                      <div className="w-48 flex-shrink-0 px-4 py-3">
                        <p
                          className="text-sm text-slate-300 truncate cursor-pointer hover:text-primary-300 transition-colors"
                          onClick={() => setEditingTask(task)}
                        >
                          {task.title}
                        </p>
                        {task.assignee && (
                          <p className="text-xs text-slate-600 mt-0.5">{task.assignee.full_name}</p>
                        )}
                      </div>
                      <div className="flex-1 relative py-3 h-12">
                        {/* Today line */}
                        {todayPct >= 0 && todayPct <= 100 && (
                          <div
                            className="absolute top-0 bottom-0 w-px bg-primary-500/50 z-10"
                            style={{ left: `${todayPct}%` }}
                          />
                        )}
                        {/* Day grid lines */}
                        {days.map((_, i) => (
                          <div
                            key={i}
                            className="absolute top-0 bottom-0 border-l border-slate-800/50"
                            style={{ left: `${(i / DAYS_TO_SHOW) * 100}%` }}
                          />
                        ))}
                        {/* Task bar */}
                        {bar && (
                          <div
                            className="absolute top-1/2 -translate-y-1/2 h-6 rounded-md cursor-pointer hover:brightness-110 transition-all flex items-center px-2"
                            style={{
                              left: bar.left,
                              width: bar.width,
                              backgroundColor: (STATUS_COLORS[task.status] || '#6366f1') + '40',
                              borderLeft: `3px solid ${STATUS_COLORS[task.status] || '#6366f1'}`,
                              minWidth: '8px',
                            }}
                            onClick={() => setEditingTask(task)}
                            title={task.title}
                          >
                            <span className="text-xs truncate font-medium" style={{ color: STATUS_COLORS[task.status] || '#6366f1' }}>
                              {task.title}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
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
    </>
  )
}
