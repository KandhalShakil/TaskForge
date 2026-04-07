import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, Area, AreaChart
} from 'recharts'
import { CheckCircle2, Clock, AlertTriangle, ListTodo, Loader2, TrendingUp } from 'lucide-react'
import { useTaskStore } from '../../store/taskStore'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { TASK_STATUSES, TASK_PRIORITIES } from '../../utils/constants'

const STATUS_CHART_COLORS = {
  todo: '#475569',
  in_progress: '#3b82f6',
  in_review: '#eab308',
  done: '#22c55e',
  cancelled: '#ef4444',
}

const PRIORITY_CHART_COLORS = {
  urgent: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6',
  no_priority: '#475569',
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-800 border border-slate-700 rounded-lg p-3 shadow-xl">
        <p className="text-xs text-slate-400 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-sm font-medium" style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function AnalyticsDashboard() {
  const { workspaceId } = useParams()
  const { activeWorkspace } = useWorkspaceStore()
  const { stats, fetchStats } = useTaskStore()

  useEffect(() => {
    if (workspaceId) {
      fetchStats({ workspace: workspaceId })
    }
  }, [workspaceId])

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-primary-500" size={32} />
      </div>
    )
  }

  const statusData = TASK_STATUSES.map((s) => ({
    name: s.label,
    value: stats.by_status?.[s.value] || 0,
    color: STATUS_CHART_COLORS[s.value],
  })).filter((d) => d.value > 0)

  const priorityData = TASK_PRIORITIES.map((p) => ({
    name: p.label,
    value: stats.by_priority?.[p.value] || 0,
    color: PRIORITY_CHART_COLORS[p.value],
  })).filter((d) => d.value > 0)

  const dailyData = (stats.daily_created || []).map((d) => ({
    date: d.date.slice(5), // MM-DD
    Tasks: d.count,
  }))

  const statCards = [
    {
      label: 'Total Tasks',
      value: stats.total || 0,
      icon: <ListTodo size={20} />,
      color: 'text-primary-400',
      bg: 'bg-primary-900/30',
    },
    {
      label: 'Completed',
      value: stats.by_status?.done || 0,
      icon: <CheckCircle2 size={20} />,
      color: 'text-green-400',
      bg: 'bg-green-900/30',
    },
    {
      label: 'In Progress',
      value: stats.by_status?.in_progress || 0,
      icon: <Clock size={20} />,
      color: 'text-blue-400',
      bg: 'bg-blue-900/30',
    },
    {
      label: 'Overdue',
      value: stats.overdue || 0,
      icon: <AlertTriangle size={20} />,
      color: 'text-red-400',
      bg: 'bg-red-900/30',
    },
  ]

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Analytics</h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">{activeWorkspace?.name} · Task overview</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto bg-surface-800 border border-slate-700 rounded-xl px-3 py-2 shadow-sm">
          <TrendingUp size={14} className="text-primary-400" />
          <span className="text-xs md:text-sm text-slate-300 font-medium">
            {stats.completion_rate}% complete
          </span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="stat-card">
            <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center ${card.color} flex-shrink-0`}>
              {card.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{card.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Status pie */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Tasks by Status</h2>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => <span className="text-xs text-slate-400">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-slate-600 text-sm">No data yet</div>
          )}
        </div>

        {/* Priority bar chart */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Tasks by Priority</h2>
          {priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={priorityData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Tasks" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-slate-600 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Daily created area chart */}
      {dailyData.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Tasks Created — Last 30 Days</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="Tasks"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#colorTasks)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Completion rate */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">Overall Completion Rate</h2>
          <span className="text-2xl font-bold text-primary-400">{stats.completion_rate}%</span>
        </div>
        <div className="h-3 bg-surface-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-600 to-green-500 rounded-full transition-all duration-700"
            style={{ width: `${stats.completion_rate}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-2">
          <span>{stats.by_status?.done || 0} completed</span>
          <span>{stats.total} total tasks</span>
        </div>
      </div>
    </div>
  )
}
