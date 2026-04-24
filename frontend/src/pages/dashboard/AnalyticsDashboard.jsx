import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts'
import {
  CheckCircle2, Clock, AlertTriangle, ListTodo, TrendingUp,
  RefreshCw, AlertCircle, ClipboardList, ArrowRight, BarChart2,
} from 'lucide-react'
import { useTaskStore } from '../../store/taskStore'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { TASK_STATUSES, TASK_PRIORITIES } from '../../utils/constants'

// ─── Color maps ───────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  todo: '#475569',
  in_progress: '#3b82f6',
  in_review: '#eab308',
  done: '#22c55e',
  cancelled: '#ef4444',
}

const PRIORITY_COLORS = {
  urgent: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6',
  no_priority: '#475569',
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-800 border border-slate-700/80 rounded-xl px-4 py-3 shadow-2xl backdrop-blur-md">
      {label && <p className="text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-bold" style={{ color: p.color || p.fill }}>
          {p.name}: <span className="tabular-nums">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

// ─── Skeleton helpers ─────────────────────────────────────────────────────────
function SkeletonBlock({ className = '', style }) {
  return <div className={`skeleton ${className}`} style={style} />
}

function SkeletonStatCards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card p-4 md:p-5 flex items-center gap-3 md:gap-4">
          <SkeletonBlock className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <SkeletonBlock className="h-6 md:h-7 w-10 rounded-lg" />
            <SkeletonBlock className="h-3 w-16 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

function SkeletonChart({ height = 220 }) {
  return (
    <div className="space-y-3">
      <SkeletonBlock className="h-4 w-36 rounded" />
      <SkeletonBlock style={{ height }} className="rounded-xl w-full" />
    </div>
  )
}

// ─── Chart empty state ────────────────────────────────────────────────────────
function ChartEmpty({ message = 'No data yet', height = 200 }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 text-slate-600 rounded-xl border border-dashed border-slate-800/80"
      style={{ height }}
    >
      <BarChart2 size={26} className="text-slate-700" />
      <p className="text-xs md:text-sm font-medium text-slate-600">{message}</p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AnalyticsDashboard() {
  const { workspaceId } = useParams()
  const navigate = useNavigate()
  const { activeWorkspace } = useWorkspaceStore()
  const { stats, statsLoading, statsError, fetchStats } = useTaskStore()

  const [lastUpdated, setLastUpdated] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(
    async (showRefreshSpin = false) => {
      if (!workspaceId) return
      if (showRefreshSpin) setRefreshing(true)
      try {
        await fetchStats({ workspace: workspaceId })
        setLastUpdated(new Date())
      } catch {
        // error stored in store
      } finally {
        if (showRefreshSpin) setRefreshing(false)
      }
    },
    [workspaceId, fetchStats],
  )

  useEffect(() => {
    load()
  }, [load])

  const handleRefresh = () => load(true)

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (statsLoading && !stats) {
    return (
      <div className="p-3 sm:p-4 md:p-6 w-full max-w-7xl mx-auto space-y-4 md:space-y-6 pb-8">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <SkeletonBlock className="h-6 w-28 md:h-7 md:w-36 rounded-lg" />
            <SkeletonBlock className="h-3 w-40 md:w-52 rounded" />
          </div>
          <SkeletonBlock className="h-8 w-20 md:h-9 md:w-24 rounded-xl flex-shrink-0" />
        </div>
        <SkeletonStatCards />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="card p-4 md:p-5"><SkeletonChart height={200} /></div>
          <div className="card p-4 md:p-5"><SkeletonChart height={200} /></div>
        </div>
        <div className="card p-4 md:p-5"><SkeletonChart height={160} /></div>
        <div className="card p-4 md:p-5"><SkeletonChart height={80} /></div>
      </div>
    )
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (statsError && !stats) {
    return (
      <div className="p-3 sm:p-4 md:p-6 w-full max-w-7xl mx-auto">
        <div className="card p-8 md:p-12 flex flex-col items-center gap-5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-900/30 flex items-center justify-center">
            <AlertCircle size={28} className="text-red-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white mb-1">Failed to load data</h2>
            <p className="text-sm text-slate-400 max-w-xs">{statsError}</p>
          </div>
          <button onClick={handleRefresh} className="btn-primary gap-2">
            <RefreshCw size={15} /> Try again
          </button>
        </div>
      </div>
    )
  }

  // ── Derived data ──────────────────────────────────────────────────────────
  const total = stats?.total ?? 0
  const done = stats?.by_status?.done ?? 0
  const inProgress = stats?.by_status?.in_progress ?? 0
  const overdue = stats?.overdue ?? 0
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0

  const statusData = TASK_STATUSES.map((s) => ({
    name: s.label,
    value: stats?.by_status?.[s.value] ?? 0,
    color: STATUS_COLORS[s.value],
  })).filter((d) => d.value > 0)

  const priorityData = TASK_PRIORITIES.map((p) => ({
    name: p.label,
    value: stats?.by_priority?.[p.value] ?? 0,
    color: PRIORITY_COLORS[p.value],
  })).filter((d) => d.value > 0)

  const dailyData = (stats?.daily_created ?? []).map((d) => ({
    date: d.date.slice(5),
    Tasks: d.count,
  }))

  const statCards = [
    {
      label: 'Total Tasks',
      value: total,
      icon: <ListTodo size={18} />,
      color: 'text-primary-400',
      bg: 'from-primary-500/20 to-primary-600/10',
      ring: 'border-primary-500/20',
    },
    {
      label: 'Completed',
      value: done,
      icon: <CheckCircle2 size={18} />,
      color: 'text-green-400',
      bg: 'from-green-500/20 to-green-600/10',
      ring: 'border-green-500/20',
    },
    {
      label: 'In Progress',
      value: inProgress,
      icon: <Clock size={18} />,
      color: 'text-blue-400',
      bg: 'from-blue-500/20 to-blue-600/10',
      ring: 'border-blue-500/20',
    },
    {
      label: 'Overdue',
      value: overdue,
      icon: <AlertTriangle size={18} />,
      color: 'text-red-400',
      bg: 'from-red-500/20 to-red-600/10',
      ring: 'border-red-500/20',
    },
  ]

  const isEmpty = total === 0

  return (
    <div className="app-container py-4 md:py-6 space-y-4 md:space-y-6 pb-12">

      {/* ── Header ── */}
      <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight leading-tight">
            Analytics
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-0.5 truncate">
            {activeWorkspace?.name}&nbsp;·&nbsp;Task overview
            {lastUpdated && (
              <span className="ml-1.5 text-slate-600">
                · {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Completion badge */}
          <div className="flex items-center gap-1.5 bg-surface-800 border border-slate-700 rounded-xl px-2.5 py-1.5 md:px-3 md:py-2 shadow-sm">
            <TrendingUp size={13} className="text-primary-400" />
            <span className="text-xs md:text-sm text-slate-300 font-semibold tabular-nums">
              {completionRate}%
            </span>
          </div>
          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={refreshing || statsLoading}
            title="Refresh data"
            className="p-1.5 md:p-2 rounded-xl bg-surface-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 hover:bg-surface-700 transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Error banner ── */}
      {statsError && stats && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-950/40 border border-red-800/60 text-sm text-red-300">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span className="flex-1 text-xs md:text-sm">{statsError}</span>
          <button
            onClick={handleRefresh}
            className="text-red-400 hover:text-red-200 font-semibold underline underline-offset-2 transition-colors text-xs md:text-sm flex-shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Empty state ── */}
      {isEmpty ? (
        <div className="card p-8 sm:p-12 md:p-16 flex flex-col items-center gap-5 md:gap-6 text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-gradient-to-br from-primary-500/20 to-purple-600/20 border border-primary-500/20 flex items-center justify-center shadow-lg shadow-primary-900/20">
            <ClipboardList size={28} className="text-primary-400 md:text-[36px]" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white mb-2">No tasks yet</h2>
            <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
              No tasks available. Create your first task to see analytics and track your team's progress.
            </p>
          </div>
          <button onClick={() => navigate(`/workspaces/${workspaceId}`)} className="btn-primary gap-2">
            Go to workspace <ArrowRight size={15} />
          </button>
        </div>
      ) : (
        <>
          {/* ── Stat cards — 2-col on mobile, 4-col on desktop ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {statCards.map((card) => (
              <div key={card.label} className="card p-4 md:p-5 flex items-center gap-3 md:gap-4 card-hover group">
                <div
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${card.bg} border ${card.ring} flex items-center justify-center ${card.color} flex-shrink-0 transition-transform duration-200 group-hover:scale-110`}
                >
                  {card.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-black text-white tabular-nums leading-none">{card.value}</p>
                  <p className="text-[10px] md:text-xs text-slate-500 mt-1 font-medium leading-tight">{card.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Charts row — stacked on mobile, side-by-side on md+ ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

            {/* Status pie */}
            <div className="card p-4 md:p-5">
              <h2 className="text-xs md:text-sm font-semibold text-white mb-3 md:mb-4">Tasks by Status</h2>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {statusData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      iconType="circle"
                      iconSize={7}
                      wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                      formatter={(value) => (
                        <span style={{ color: '#94a3b8' }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <ChartEmpty message="No status data yet" height={200} />
              )}
            </div>

            {/* Priority bar */}
            <div className="card p-4 md:p-5">
              <h2 className="text-xs md:text-sm font-semibold text-white mb-3 md:mb-4">Tasks by Priority</h2>
              {priorityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={priorityData} barSize={28} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      width={24}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Tasks" radius={[5, 5, 0, 0]}>
                      {priorityData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ChartEmpty message="No priority data yet" height={200} />
              )}
            </div>
          </div>

          {/* ── Daily created area chart ── */}
          <div className="card p-4 md:p-5">
            <h2 className="text-xs md:text-sm font-semibold text-white mb-3 md:mb-4">
              Tasks Created — Last 30 Days
            </h2>
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={dailyData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#64748b', fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    width={24}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="Tasks"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fill="url(#colorTasks)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmpty message="No activity in the last 30 days" height={160} />
            )}
          </div>

          {/* ── Completion rate ── */}
          <div className="card p-4 md:p-5">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h2 className="text-xs md:text-sm font-semibold text-white">Overall Completion Rate</h2>
              <span
                className="text-xl md:text-2xl font-black tabular-nums"
                style={{
                  background: `linear-gradient(135deg, #6366f1 0%, #22c55e ${completionRate}%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {completionRate}%
              </span>
            </div>
            <div className="h-2.5 md:h-3 bg-surface-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-600 via-primary-500 to-green-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-2">
              <span className="font-medium">
                <span className="text-green-400 font-bold">{done}</span> completed
              </span>
              <span>
                <span className="text-slate-300 font-bold">{total}</span> total
              </span>
            </div>

            {/* Status breakdown — 2-col on mobile, 5-col on sm+ ── */}
            <div className="mt-4 grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-2">
              {TASK_STATUSES.map((s) => {
                const count = stats?.by_status?.[s.value] ?? 0
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                return (
                  <div
                    key={s.value}
                    className="bg-surface-800/60 rounded-xl p-2.5 md:p-3 text-center border border-slate-800/40"
                  >
                    <div
                      className="w-2 h-2 rounded-full mx-auto mb-1.5"
                      style={{ background: STATUS_COLORS[s.value] }}
                    />
                    <p className="text-sm font-bold text-white tabular-nums">{count}</p>
                    <p className="text-[9px] md:text-[10px] text-slate-500 mt-0.5 leading-tight">{s.label}</p>
                    <p className="text-[9px] md:text-[10px] text-slate-600 mt-0.5">{pct}%</p>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
