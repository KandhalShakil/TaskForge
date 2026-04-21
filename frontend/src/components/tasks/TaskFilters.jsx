import { Search, X, ChevronDown, Filter } from 'lucide-react'
import { useTaskStore } from '../../store/taskStore'
import { TASK_STATUSES, TASK_PRIORITIES } from '../../utils/constants'

export default function TaskFilters({ members = [], categories = [] }) {
  const { filters, setFilters, clearFilters } = useTaskStore()

  const hasActiveFilters = Object.values(filters).some((v) => v !== '')

  return (
    <div className="flex flex-col lg:flex-row lg:flex-nowrap items-center gap-2 lg:gap-2.5 w-full overflow-hidden">
      {/* Search */}
      <div className="relative w-full lg:flex-[2] lg:min-w-[120px] shrink">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          className="input pl-8 py-1.5 w-full text-xs"
          placeholder="Search tasks..."
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
        />
      </div>

      {/* Status filter */}
      <div className="relative w-full lg:flex-1 lg:min-w-[100px] lg:max-w-[160px] shrink">
        <select
          className="select py-1.5 text-xs pr-7 appearance-none cursor-pointer w-full"
          value={filters.status}
          onChange={(e) => setFilters({ status: e.target.value })}
        >
          <option value="">Status</option>
          {TASK_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Priority filter */}
      <div className="relative w-full lg:flex-1 lg:min-w-[100px] lg:max-w-[160px] shrink">
        <select
          className="select py-1.5 text-xs pr-7 appearance-none cursor-pointer w-full"
          value={filters.priority}
          onChange={(e) => setFilters({ priority: e.target.value })}
        >
          <option value="">Priority</option>
          {TASK_PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>{p.icon} {p.label}</option>
          ))}
        </select>
      </div>

      {/* Assignee filter */}
      {members.length > 0 && (
        <div className="relative w-full lg:flex-1 lg:min-w-[100px] lg:max-w-[160px] shrink">
          <select
            className="select py-1.5 text-xs pr-7 appearance-none cursor-pointer w-full"
            value={filters.assignee}
            onChange={(e) => setFilters({ assignee: e.target.value })}
          >
            <option value="">Assignees</option>
            {members.map((m) => (
              <option key={m.user.id} value={m.user.id}>{m.user.full_name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="relative w-full lg:flex-1 lg:min-w-[100px] lg:max-w-[160px] shrink">
          <select
            className="select py-1.5 text-xs pr-7 appearance-none cursor-pointer w-full"
            value={filters.category}
            onChange={(e) => setFilters({ category: e.target.value })}
          >
            <option value="">Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Due date range */}
      <div className="flex flex-row items-center gap-1 w-full lg:flex-[1.5] lg:min-w-[200px] lg:max-w-[240px] shrink">
        <input
          type="date"
          className="input py-1.5 px-2 text-xs w-full flex-1"
          placeholder="From"
          value={filters.due_date_from}
          onChange={(e) => setFilters({ due_date_from: e.target.value })}
        />
        <span className="text-slate-600 text-xs">-</span>
        <input
          type="date"
          className="input py-1.5 px-2 text-xs w-full flex-1"
          placeholder="To"
          value={filters.due_date_to}
          onChange={(e) => setFilters({ due_date_to: e.target.value })}
        />
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex lg:inline-flex justify-center items-center gap-1 text-xs text-slate-400 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-950/20 w-full lg:w-auto shrink-0 border border-transparent"
        >
          <X size={12} /> Clear
        </button>
      )}
    </div>
  )
}
