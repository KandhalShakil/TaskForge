import { Search, X, Filter, User, Tag, Calendar, ChevronUp } from 'lucide-react'
import { useTaskStore } from '../../store/taskStore'
import { TASK_STATUSES, TASK_PRIORITIES } from '../../utils/constants'
import FilterDropdown from './FilterDropdown'
import AdvancedDatePicker from '../common/AdvancedDatePicker'

export default function TaskFilters({ members = [], categories = [], onClose }) {
  const { filters, setFilters, clearFilters } = useTaskStore()

  const hasActiveFilters = Object.values(filters).some((v) => v !== '')

  return (
    <div className="flex flex-col lg:flex-row items-center gap-3 w-full">
      {/* ... existing search and dropdowns ... */}
      
      {/* Search (repeated for context in replacement) */}
      <div className="relative w-full lg:flex-[2]">
        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" strokeWidth={2.5} />
        <input
          type="text"
          className="w-full rounded-xl h-10 pl-11 pr-4 text-[13px] font-bold bg-[#12141a]/60 border border-white/5 text-slate-200 placeholder:text-slate-600 focus:border-primary-500/50 outline-none transition-all"
          placeholder="Search protocol..."
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
        <FilterDropdown
          placeholder="Status"
          options={TASK_STATUSES}
          value={filters.status}
          onChange={(val) => setFilters({ status: val })}
          icon={Filter}
        />

        <FilterDropdown
          placeholder="Priority"
          options={TASK_PRIORITIES}
          value={filters.priority}
          onChange={(val) => setFilters({ priority: val })}
          icon={Filter}
        />

        {members.length > 0 && (
          <FilterDropdown
            placeholder="Assignee"
            options={members.map(m => ({ id: m.user.id, name: m.user.full_name }))}
            value={filters.assignee}
            onChange={(val) => setFilters({ assignee: val })}
            icon={User}
          />
        )}

        {categories.length > 0 && (
          <FilterDropdown
            placeholder="Category"
            options={categories}
            value={filters.category}
            onChange={(val) => setFilters({ category: val })}
            icon={Tag}
          />
        )}
      </div>

      <div className="flex items-center gap-2 w-full lg:w-auto">
        <div className="w-[130px]">
          <AdvancedDatePicker
            value={filters.due_date_from}
            onChange={(val) => setFilters({ due_date_from: val })}
            compact={true}
            placeholder="From Date"
          />
        </div>
        <span className="text-slate-700 text-[10px] font-black uppercase shrink-0">to</span>
        <div className="w-[130px]">
          <AdvancedDatePicker
            value={filters.due_date_to}
            onChange={(val) => setFilters({ due_date_to: val })}
            compact={true}
            placeholder="To Date"
            align="right"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-rose-400 transition-colors px-3 h-10 rounded-xl hover:bg-rose-500/5"
          >
            <X size={12} /> Clear
          </button>
        )}
        
        {onClose && (
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-all border border-white/5"
            title="Hide Filters"
          >
            <ChevronUp size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
