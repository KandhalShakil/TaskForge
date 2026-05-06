import { useState, useMemo, useEffect } from 'react'
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

export default function TimelineView({ tasks = [], project, workspace, onRefresh }) {
  // Calculate project boundaries or fallback to current month
  const projectStart = useMemo(() => project?.start_date ? parseISO(project.start_date) : startOfMonth(new Date()), [project?.start_date])
  const projectEnd = useMemo(() => project?.end_date ? parseISO(project.end_date) : endOfMonth(projectStart), [project?.end_date, projectStart])
  
  // Total days to show based on project range (min 1, max 366 for safety)
  const daysToShow = useMemo(() => {
    const diff = differenceInDays(projectEnd, projectStart) + 1
    return Math.max(1, Math.min(diff, 366))
  }, [projectStart, projectEnd])

  const [viewStart, setViewStart] = useState(projectStart)
  const [editingTask, setEditingTask] = useState(null)

  // Sync viewStart if projectStart changes
  useEffect(() => {
    setViewStart(projectStart)
  }, [projectStart])

  const viewEnd = projectEnd

  const days = useMemo(() => Array.from({ length: daysToShow }, (_, i) => {
    const d = new Date(viewStart)
    d.setDate(viewStart.getDate() + i)
    return d
  }), [viewStart, daysToShow])

  const tasksWithDates = useMemo(() => {
    return tasks.filter((t) => t.due_date || t.start_date)
  }, [tasks])

  const getTaskBar = (task) => {
    let start = task.start_date ? parseISO(task.start_date) : (task.due_date ? parseISO(task.due_date) : null)
    let end = task.due_date ? parseISO(task.due_date) : start

    if (!start || !isValid(start)) return null

    const startOffset = differenceInDays(start, viewStart)
    const duration = differenceInDays(end, start) + 1

    if (startOffset >= daysToShow || startOffset + duration < 0) return null

    const clampedStart = Math.max(0, startOffset)
    const clampedDuration = Math.min(duration - (clampedStart - startOffset), daysToShow - clampedStart)

    return {
      left: `${(clampedStart / daysToShow) * 100}%`,
      width: `${(Math.max(1, clampedDuration) / daysToShow) * 100}%`,
    }
  }

  const today = new Date()
  const todayOffset = differenceInDays(today, viewStart)
  const todayPct = (todayOffset / daysToShow) * 100

  return (
    <>
      <div className="card overflow-hidden">
        {/* Navigation - Locked to Project Dates */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-surface-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/20">
              <Calendar size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Project Timeline</p>
              <h3 className="text-sm font-bold text-white mt-0.5">
                {format(projectStart, 'MMMM d')} – {format(projectEnd, 'MMMM d, yyyy')}
              </h3>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             <span className="badge bg-slate-800 text-slate-400 border-white/5">{daysToShow} Days Scope</span>
          </div>
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
                            style={{ left: `${(i / daysToShow) * 100}%` }}
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
