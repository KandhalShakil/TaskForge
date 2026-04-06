import { useState, useMemo } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, parseISO } from 'date-fns'
import enUS from 'date-fns/locale/en-US'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import TaskModal from '../tasks/TaskModal'

const locales = { 'en-US': enUS }
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

const STATUS_COLORS = {
  todo: '#475569',
  in_progress: '#3b82f6',
  in_review: '#eab308',
  done: '#22c55e',
  cancelled: '#ef4444',
}

export default function CalendarView({ tasks = [], project, workspace, onRefresh }) {
  const [date, setDate] = useState(new Date())
  const [editingTask, setEditingTask] = useState(null)
  const [view, setView] = useState('month')

  const events = useMemo(() => {
    return tasks
      .filter((t) => t.due_date)
      .map((task) => ({
        id: task.id,
        title: task.title,
        start: parseISO(task.due_date),
        end: parseISO(task.due_date),
        allDay: true,
        resource: task,
        color: STATUS_COLORS[task.status] || '#6366f1',
      }))
  }, [tasks])

  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: event.color + '30',
      borderLeft: `3px solid ${event.color}`,
      color: '#e2e8f0',
      borderRadius: '4px',
      padding: '2px 6px',
      fontSize: '11px',
      fontWeight: '500',
    },
  })

  return (
    <>
      <div className="h-[calc(100vh-220px)] bg-surface-950 rounded-xl border border-slate-800 overflow-hidden calendar-dark">
        <style>{`
          .calendar-dark .rbc-calendar { background: transparent; color: #cbd5e1; }
          .calendar-dark .rbc-header { background: #0f172a; border-color: #1e293b; color: #94a3b8; font-size: 12px; font-weight: 600; padding: 8px; }
          .calendar-dark .rbc-month-view { border-color: #1e293b; }
          .calendar-dark .rbc-day-bg { background: transparent; }
          .calendar-dark .rbc-day-bg:hover { background: #1e293b30; }
          .calendar-dark .rbc-off-range-bg { background: #0f172a80; }
          .calendar-dark .rbc-today { background: #312e8130; }
          .calendar-dark .rbc-date-cell { color: #94a3b8; font-size: 12px; padding: 4px 6px; }
          .calendar-dark .rbc-date-cell.rbc-now { color: #818cf8; font-weight: 700; }
          .calendar-dark .rbc-btn-group button { background: #1e293b; border-color: #334155; color: #94a3b8; }
          .calendar-dark .rbc-btn-group button:hover { background: #334155; color: #f1f5f9; }
          .calendar-dark .rbc-btn-group button.rbc-active { background: #4f46e5; border-color: #4f46e5; color: #fff; }
          .calendar-dark .rbc-toolbar-label { color: #f1f5f9; font-weight: 600; }
          .calendar-dark .rbc-show-more { color: #818cf8; font-size: 11px; }
          .calendar-dark .rbc-month-row + .rbc-month-row { border-color: #1e293b; }
          .calendar-dark .rbc-day-bg + .rbc-day-bg { border-color: #1e293b; }
        `}</style>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          date={date}
          view={view}
          onNavigate={setDate}
          onView={setView}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={(event) => setEditingTask(event.resource)}
          style={{ height: '100%', padding: '12px' }}
        />
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
