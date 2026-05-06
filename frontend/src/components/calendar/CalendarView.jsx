import { useState, useMemo, useEffect } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, parseISO, isValid } from 'date-fns'
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

const CustomToolbar = ({ label, onNavigate, onView, view }) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between p-4 gap-4 bg-surface-900/50 border-b border-slate-800">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-xl border border-white/5 shadow-inner">
          <button
            onClick={() => onNavigate('PREV')}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
            title="Previous"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => onNavigate('TODAY')}
            className="px-4 py-1.5 rounded-lg bg-primary-500/10 text-primary-400 text-[10px] font-black uppercase tracking-widest border border-primary-500/20 hover:bg-primary-500/20 transition-all"
          >
            Today
          </button>
          <button
            onClick={() => onNavigate('NEXT')}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
            title="Next"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        
        <div className="text-xs font-black text-white uppercase tracking-[0.2em] px-2">
          {label}
        </div>
      </div>

      <div className="flex items-center bg-slate-900/50 p-1 rounded-xl border border-white/5 shadow-inner">
        {[
          { id: 'month', label: 'Month' },
          { id: 'week', label: 'Week' },
          { id: 'day', label: 'Day' },
          { id: 'agenda', label: 'Agenda' }
        ].map((v) => (
          <button
            key={v.id}
            onClick={() => onView(v.id)}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              view === v.id 
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  )
}

const AgendaEvent = ({ event }) => {
  const task = event.resource
  return (
    <div className="flex items-center gap-4 py-3 px-4 group cursor-pointer hover:bg-white/[0.02] transition-all rounded-xl">
      <div 
        className="w-1.5 h-10 rounded-full shrink-0 shadow-lg shadow-black/20" 
        style={{ backgroundColor: event.color }}
      />
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-white truncate group-hover:text-primary-400 transition-all">
          {task.title}
        </h4>
        <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800/50 border border-white/5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: event.color }} />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              {task.status.replace('_', ' ')}
            </span>
          </div>
          {task.priority && (
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-600">
              {task.priority} Priority
            </span>
          )}
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-0.5">Deadline</p>
        <p className="text-xs font-black text-slate-200 bg-slate-800/50 px-2 py-1 rounded-lg border border-white/5">
          {format(event.start, 'MMM dd')}
        </p>
      </div>
    </div>
  )
}

const NoEventsMessage = () => (
  <div className="flex flex-col items-center justify-center h-full py-20 text-center">
    <div className="w-16 h-16 rounded-3xl bg-slate-900/50 flex items-center justify-center mb-4 border border-white/5">
      <CalendarIcon size={24} className="text-slate-700" />
    </div>
    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Protocol Events</h3>
    <p className="text-[11px] text-slate-600 mt-1 max-w-[200px]">There are no tasks scheduled within this specific timeframe.</p>
  </div>
)

export default function CalendarView({ tasks = [], project, workspace, onRefresh }) {
  // Initialize to project start date or today
  const initialDate = useMemo(() => {
    if (project?.start_date) {
      const parsed = parseISO(project.start_date)
      return isValid(parsed) ? parsed : new Date()
    }
    return new Date()
  }, [project?.start_date])

  const [date, setDate] = useState(initialDate)
  const [editingTask, setEditingTask] = useState(null)
  const [view, setView] = useState('month')

  // Sync date if project changes
  useEffect(() => {
    if (project?.start_date) {
      const parsed = parseISO(project.start_date)
      if (isValid(parsed)) setDate(parsed)
    }
  }, [project?.start_date])

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
    className: 'custom-calendar-event',
    style: {
      backgroundColor: event.color + '20',
      borderLeft: `4px solid ${event.color}`,
      color: '#fff',
      borderRadius: '8px',
      padding: '4px 8px',
      fontSize: '10px',
      fontWeight: 'bold',
      borderTop: 'none',
      borderRight: 'none',
      borderBottom: 'none',
    },
  })

  return (
    <>
      <div className="h-[calc(100vh-220px)] bg-[#0b0c10] rounded-2xl border border-white/5 overflow-hidden shadow-2xl calendar-premium">
        <style>{`
          .calendar-premium .rbc-calendar { font-family: inherit; }
          .calendar-premium .rbc-month-view { border: none; }
          .calendar-premium .rbc-month-row { border-color: rgba(255,255,255,0.03); min-height: 100px; }
          .calendar-premium .rbc-header { 
            padding: 12px; 
            background: rgba(255,255,255,0.01); 
            border-bottom: 1px solid rgba(255,255,255,0.05);
            color: #64748b;
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.1em;
          }
          .calendar-premium .rbc-day-bg { border-left: 1px solid rgba(255,255,255,0.03); transition: background 0.2s; }
          .calendar-premium .rbc-day-bg:hover { background: rgba(255,255,255,0.015); }
          .calendar-premium .rbc-today { background: rgba(99, 102, 241, 0.05); }
          .calendar-premium .rbc-off-range-bg { background: rgba(0,0,0,0.1); opacity: 0.3; }
          .calendar-premium .rbc-date-cell { 
            padding: 8px; 
            color: #94a3b8; 
            font-size: 11px; 
            font-weight: 700;
          }
          .calendar-premium .rbc-now .rbc-button-link { 
            color: #818cf8; 
            background: rgba(129, 140, 248, 0.1);
            padding: 2px 6px;
            border-radius: 6px;
          }
          .calendar-premium .rbc-event { padding: 0; background: transparent !important; }
          .calendar-premium .rbc-event-label { display: none; }
          .calendar-premium .rbc-show-more {
            background: rgba(255,255,255,0.03);
            color: #818cf8;
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            padding: 2px 6px;
            border-radius: 4px;
            margin: 2px;
          }
          .calendar-premium .rbc-agenda-view { border: none; background: transparent; padding: 20px; }
          .calendar-premium .rbc-agenda-table { background: transparent; border: none; border-spacing: 0 12px; border-collapse: separate; }
          .calendar-premium .rbc-agenda-table thead { display: none; }
          .calendar-premium .rbc-agenda-date-cell { display: none; }
          .calendar-premium .rbc-agenda-time-cell { display: none; }
          .calendar-premium .rbc-agenda-event-cell { padding: 0; border: none; background: transparent; }
          .calendar-premium .rbc-agenda-empty { 
            background: transparent !important; 
            border: none !important; 
            color: #475569;
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            padding: 100px 20px !important;
            text-align: center;
          }
          .calendar-premium .rbc-agenda-empty::before {
            content: 'PROTOCOL EMPTY';
            display: block;
            color: #1e293b;
            font-size: 32px;
            font-weight: 900;
            margin-bottom: 8px;
            letter-spacing: -0.05em;
          }
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
          messages={{
            noEventsInRange: 'No Protocol Events Found'
          }}
          components={{
            toolbar: CustomToolbar,
            agenda: {
              event: AgendaEvent
            },
            noEventsMessage: NoEventsMessage
          }}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={(event) => setEditingTask(event.resource)}
          style={{ height: '100%' }}
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
