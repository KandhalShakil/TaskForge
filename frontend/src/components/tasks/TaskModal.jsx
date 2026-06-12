import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import {
  X, Trash2, ChevronDown, ChevronUp, ChevronRight,
  Check, Plus, User, Clock, Flag, AlignLeft, Layers,
  Circle, CheckCircle2, AlertCircle, Loader2, ArrowRight,
  ListTodo, CornerDownRight, Pencil, XCircle,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import { useTaskStore } from '../../store/taskStore'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useAuthStore } from '../../store/authStore'
import { TASK_STATUSES, TASK_PRIORITIES } from '../../utils/constants'
import { calculateTaskHoursLimit, extractApiError, validateTask } from '../../utils/validation'
import { stripHtml } from '../../utils/html'
import { tasksAPI } from '../../api/tasks'
import ConfirmModal from '../common/ConfirmModal'
import AdvancedDatePicker from '../common/AdvancedDatePicker'
import CreateCategoryModal from './CreateCategoryModal'

const makeTempKey = () => typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`

const flattenSubtasks = (items = [], parentId = null, bucket = []) => {
  items.forEach((item, index) => {
    const parentRef = item?.parent_id ?? item?.parent ?? parentId
    const normalizedParent = typeof parentRef === 'string' ? parentRef : null
    const tempKey = makeTempKey()
    bucket.push({ id: item?.id || null, temp_key: tempKey, title: item?.title || '', description: item?.description || '', status: item?.status || 'todo', priority: item?.priority || 'no_priority', assignee_id: item?.assignee?.id || item?.assignee_id || '', category_id: item?.category?.id || item?.category_id || '', start_date: item?.start_date || '', due_date: item?.due_date || '', estimated_hours: item?.estimated_hours || '', is_completed: Boolean(item?.is_completed), order: typeof item?.order === 'number' ? item.order : index, parent_id: normalizedParent, parent_temp_key: null })
    if (Array.isArray(item?.children) && item.children.length > 0) flattenSubtasks(item.children, item?.id || tempKey, bucket)
  })
  return bucket
}

const hydrateParentTempKeys = (items) => {
  const idToKey = new Map(items.filter((i) => i.id).map((i) => [i.id, i.temp_key]))
  return items.map((item) => ({ ...item, parent_temp_key: item.parent_id ? idToKey.get(item.parent_id) || null : null }))
}

const buildChildrenMap = (items) => {
  const map = new Map()
  items.forEach((item) => { const pk = item.parent_id || item.parent_temp_key || null; if (!map.has(pk)) map.set(pk, []); map.get(pk).push(item) })
  return map
}

const collectBranchKeys = (node, childrenMap, bucket = new Set()) => {
  const key = node.id || node.temp_key; bucket.add(key)
  ;(childrenMap.get(key) || []).forEach((c) => collectBranchKeys(c, childrenMap, bucket))
  return bucket
}

const normalizeSubtasksForSave = (items) => {
  const cleaned = items.map((item) => ({ ...item, title: (item.title || '').trim(), description: stripHtml(item.description), assignee_id: item.assignee_id || null, category_id: item.category_id || null, start_date: item.start_date || null, due_date: item.due_date || null, estimated_hours: item.estimated_hours === '' ? null : item.estimated_hours, source_key: item.id || item.temp_key })).filter((item) => item.title.length > 0)
  const validKeys = new Set(cleaned.map((i) => i.source_key)); const siblingOrder = new Map()
  return cleaned.map((item) => { const tentative = item.parent_id || item.parent_temp_key || null; const parentKey = tentative && validKeys.has(tentative) ? tentative : null; const order = siblingOrder.get(parentKey) || 0; siblingOrder.set(parentKey, order + 1); return { id: item.id, source_key: item.source_key, title: item.title, description: item.description, status: item.status || 'todo', priority: item.priority || 'no_priority', assignee_id: item.assignee_id, category_id: item.category_id, start_date: item.start_date, due_date: item.due_date, estimated_hours: item.estimated_hours, is_completed: Boolean(item.is_completed), order, parent_key: parentKey } })
}

const toNestedSubtasksInput = (prepared) => {
  const cMap = new Map(); prepared.forEach((item) => { const pk = item.parent_key || null; if (!cMap.has(pk)) cMap.set(pk, []); cMap.get(pk).push(item) })
  const buildNode = (node) => ({ title: node.title, description: node.description, status: node.status, priority: node.priority, assignee_id: node.assignee_id, category_id: node.category_id, start_date: node.start_date, due_date: node.due_date, estimated_hours: node.estimated_hours, is_completed: node.is_completed, order: node.order, children: (cMap.get(node.source_key) || []).map(buildNode) })
  return (cMap.get(null) || []).map(buildNode)
}

const STATUS_CFG = {
  todo:        { color: '#64748b', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.2)', Icon: Circle,       label: 'To Do' },
  in_progress: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)',  Icon: ArrowRight,   label: 'In Progress' },
  in_review:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)',  Icon: AlertCircle,  label: 'In Review' },
  done:        { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)',   Icon: CheckCircle2, label: 'Done' },
  cancelled:   { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)',   Icon: XCircle,      label: 'Cancelled' },
}

const PRIORITY_CFG = {
  urgent:      { color: '#ef4444', dot: '#ef4444', bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.25)',   label: 'Urgent' },
  high:        { color: '#f97316', dot: '#f97316', bg: 'rgba(249,115,22,0.1)',   border: 'rgba(249,115,22,0.25)',  label: 'High' },
  medium:      { color: '#eab308', dot: '#eab308', bg: 'rgba(234,179,8,0.1)',    border: 'rgba(234,179,8,0.25)',   label: 'Medium' },
  low:         { color: '#3b82f6', dot: '#3b82f6', bg: 'rgba(59,130,246,0.1)',   border: 'rgba(59,130,246,0.25)',  label: 'Low' },
  no_priority: { color: '#64748b', dot: '#64748b', bg: 'rgba(100,116,139,0.1)',  border: 'rgba(100,116,139,0.2)',  label: 'None' },
}

function FieldLabel({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      {Icon && <Icon size={11} className="text-slate-600" />}
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{children}</span>
    </div>
  )
}

function AvatarInitials({ name = '?' }) {
  const initials = name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)
  const palettes = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500']
  const ci = name.charCodeAt(0) % palettes.length
  return <div className={`w-6 h-6 ${palettes[ci]} rounded-lg flex items-center justify-center font-bold text-white text-[9px] flex-shrink-0 select-none`}>{initials}</div>
}

function StatusCard({ value, selected, onClick, disabled }) {
  const cfg = STATUS_CFG[value] || STATUS_CFG.todo; const Icon = cfg.Icon
  return <button type="button" disabled={disabled} onClick={() => onClick(value)} className="flex-1 flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border transition-all min-w-[52px]" style={{ backgroundColor: selected ? cfg.bg : 'rgba(255,255,255,0.02)', borderColor: selected ? cfg.border : 'rgba(255,255,255,0.05)', opacity: disabled ? 0.4 : 1 }}><Icon size={14} style={{ color: selected ? cfg.color : '#475569' }} strokeWidth={selected ? 2.5 : 1.5} /><span className="text-[9px] font-bold leading-none" style={{ color: selected ? cfg.color : '#475569' }}>{cfg.label}</span></button>
}

function PriorityChip({ value, selected, onClick, disabled }) {
  const cfg = PRIORITY_CFG[value] || PRIORITY_CFG.no_priority
  return <button type="button" disabled={disabled} onClick={() => onClick(value)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all" style={{ backgroundColor: selected ? cfg.bg : 'rgba(255,255,255,0.02)', borderColor: selected ? cfg.border : 'rgba(255,255,255,0.05)', color: selected ? cfg.color : '#64748b', opacity: disabled ? 0.4 : 1 }}><span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.dot }} />{cfg.label}</button>
}

function Dropdown({ label, trigger, children, open, setOpen, error, disabled }) {
  const ref = useRef(null)
  useEffect(() => { const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h) }, [setOpen])
  return (
    <div ref={ref} className="relative">
      {label && <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">{label}</label>}
      <button type="button" disabled={disabled} onClick={() => setOpen((o) => !o)} className={`w-full flex items-center gap-2 px-3 h-10 rounded-xl border transition-all text-left ${open ? 'border-primary-500/40 bg-white/[0.05]' : 'border-white/5 bg-white/[0.02] hover:border-white/10'} ${error ? '!border-rose-500/30' : ''} ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>{trigger}<ChevronDown size={12} className="text-slate-600 ml-auto flex-shrink-0" /></button>
      <AnimatePresence>{open && (<motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.12 }} className="absolute z-50 top-full mt-1 w-full bg-[#0d1117] border border-white/10 rounded-xl shadow-2xl overflow-hidden">{children}</motion.div>)}</AnimatePresence>
      {error && <p className="text-[10px] text-rose-400 mt-1 ml-1">{error}</p>}
    </div>
  )
}

function MemberDropdown({ label, members, value, onChange, error, disabled }) {
  const [open, setOpen] = useState(false); const selected = members.find((m) => m.user.id === value)
  return (
    <Dropdown label={label} open={open} setOpen={setOpen} error={error} disabled={disabled} trigger={selected ? <><AvatarInitials name={selected.user.full_name} /><span className="text-[12px] font-medium text-slate-200 truncate">{selected.user.full_name}</span></> : <><div className="w-6 h-6 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center"><User size={12} className="text-slate-600" /></div><span className="text-[12px] text-slate-500">Unassigned</span></>}>
      <div className="max-h-44 overflow-y-auto p-1 space-y-0.5">
        <button type="button" onClick={() => { onChange(''); setOpen(false) }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/5 text-slate-400 text-[12px] transition-colors"><div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center"><User size={12} /></div>Unassigned</button>
        {members.map((m) => (<button key={m.user.id} type="button" onClick={() => { onChange(m.user.id); setOpen(false) }} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] transition-colors ${m.user.id === value ? 'bg-primary-500/10 text-primary-300' : 'hover:bg-white/5 text-slate-300'}`}><AvatarInitials name={m.user.full_name} /><span className="flex-1 truncate font-medium">{m.user.full_name}</span>{m.user.id === value && <Check size={12} className="text-primary-400 flex-shrink-0" strokeWidth={3} />}</button>))}
      </div>
    </Dropdown>
  )
}

function CategoryDropdown({ label, categories, value, onChange, error, disabled, onCreateNew }) {
  const [open, setOpen] = useState(false); const selected = categories.find((c) => c.id === value)
  return (
    <Dropdown label={label} open={open} setOpen={setOpen} error={error} disabled={disabled} trigger={<><span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: selected ? '#06b6d4' : '#334155' }} /><span className={`text-[12px] truncate ${selected ? 'text-slate-200 font-medium' : 'text-slate-500'}`}>{selected ? selected.name : 'No category'}</span></>}>
      <div className="max-h-44 overflow-y-auto p-1 space-y-0.5">
        <button type="button" onClick={() => { onChange(''); setOpen(false) }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-slate-400 text-[12px] transition-colors"><span className="w-2 h-2 rounded-full bg-slate-700" />No category</button>
        {categories.map((c) => (<button key={c.id} type="button" onClick={() => { onChange(c.id); setOpen(false) }} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] transition-colors ${c.id === value ? 'bg-primary-500/10 text-primary-300' : 'hover:bg-white/5 text-slate-300'}`}><span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" /><span className="flex-1 truncate font-medium">{c.name}</span>{c.id === value && <Check size={12} className="text-primary-400 flex-shrink-0" strokeWidth={3} />}</button>))}
      </div>
      {onCreateNew && (<div className="border-t border-white/5 p-1"><button type="button" onClick={() => { setOpen(false); onCreateNew() }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-primary-400 text-[11px] font-bold transition-colors"><Plus size={12} />New Category</button></div>)}
    </Dropdown>
  )
}

function SubtaskRow({ node, depth, byParent, expanded, onToggle, onEdit, onAddChild, onRemove, onToggleComplete, getMemberName, getCategoryName, isViewer }) {
  const nodeKey = node.id || node.temp_key; const children = byParent.get(nodeKey) || []; const hasChildren = children.length > 0; const isExpanded = expanded[nodeKey] ?? true
  const overdue = node.due_date && node.start_date && node.due_date < node.start_date
  const statusCfg = STATUS_CFG[node.status] || STATUS_CFG.todo; const priorityCfg = PRIORITY_CFG[node.priority] || PRIORITY_CFG.no_priority
  return (
    <div className="space-y-1.5">
      <div style={{ marginLeft: `${depth * 16}px` }} className={`rounded-xl border transition-all ${node.is_completed ? 'border-emerald-500/20 bg-emerald-500/[0.03]' : 'border-white/[0.06] bg-white/[0.02]'}`}>
        <div className="flex items-start gap-2.5 px-3 py-2.5">
          <div className="flex-shrink-0 pt-0.5">{hasChildren ? <button type="button" onClick={() => onToggle(nodeKey)} className="p-0.5 text-slate-500 hover:text-slate-300 transition-colors"><ChevronRight size={13} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} /></button> : <span className="inline-flex w-5 h-5 items-center justify-center text-slate-700 text-lg">·</span>}</div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md border" style={{ color: statusCfg.color, backgroundColor: statusCfg.bg, borderColor: statusCfg.border }}>{statusCfg.label}</span>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: priorityCfg.dot }} />
              <span className={`text-sm font-medium truncate max-w-[240px] ${node.is_completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>{node.title || 'Untitled'}</span>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-slate-500">
              {node.due_date && <span>Due: <span className={overdue ? 'text-rose-400' : 'text-slate-400'}>{node.due_date}</span></span>}
              {node.assignee_id && <span><span className="text-slate-400">{getMemberName(node.assignee_id)}</span></span>}
              {node.category_id && <span className="text-slate-600">{getCategoryName(node.category_id)}</span>}
            </div>
          </div>
          {!isViewer && (
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button type="button" onClick={() => onToggleComplete(nodeKey)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">{node.is_completed ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Circle size={13} className="text-slate-600" />}</button>
              <button type="button" onClick={() => onEdit(node)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors"><Pencil size={12} /></button>
              <button type="button" onClick={() => onAddChild(node)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-primary-400 transition-colors"><CornerDownRight size={12} /></button>
              <button type="button" onClick={() => onRemove(node)} className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-600 hover:text-rose-400 transition-colors"><XCircle size={12} /></button>
            </div>
          )}
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div className="ml-4 border-l border-white/5 pl-2 space-y-1.5">
          {children.map((child) => <SubtaskRow key={child.id || child.temp_key} node={child} depth={depth + 1} byParent={byParent} expanded={expanded} onToggle={onToggle} onEdit={onEdit} onAddChild={onAddChild} onRemove={onRemove} onToggleComplete={onToggleComplete} getMemberName={getMemberName} getCategoryName={getCategoryName} isViewer={isViewer} />)}
        </div>
      )}
    </div>
  )
}

function SubtaskInlineEditor({ subtask, parentLabel, members, categories, isViewer, onSave, onClose }) {
  const isEditing = Boolean(subtask?.id || subtask?.temp_key)
  const { register, handleSubmit, control } = useForm({ defaultValues: { title: subtask?.title || '', status: subtask?.status || 'todo', priority: subtask?.priority || 'no_priority', assignee_id: subtask?.assignee_id || subtask?.assignee?.id || '', category_id: subtask?.category_id || subtask?.category?.id || '', start_date: subtask?.start_date || '', due_date: subtask?.due_date || '', estimated_hours: subtask?.estimated_hours || '' } })
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1117] p-4 space-y-4">
      {parentLabel && <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Child of: <span className="text-slate-400">{parentLabel}</span></p>}
      <div className="space-y-1">
        <input autoFocus disabled={isViewer} className="w-full bg-transparent border-none text-base font-semibold text-white placeholder:text-slate-700 outline-none" placeholder="Subtask title..." {...register('title', { required: true })} />
        <div className="h-px bg-gradient-to-r from-white/10 to-transparent" />
      </div>
      <div className="space-y-2"><FieldLabel icon={Flag}>Status</FieldLabel><Controller name="status" control={control} render={({ field }) => (<div className="flex gap-1.5">{Object.keys(STATUS_CFG).map((v) => <StatusCard key={v} value={v} selected={field.value === v} onClick={field.onChange} disabled={isViewer} />)}</div>)} /></div>
      <div className="space-y-2"><FieldLabel icon={Flag}>Priority</FieldLabel><Controller name="priority" control={control} render={({ field }) => (<div className="flex flex-wrap gap-1.5">{Object.keys(PRIORITY_CFG).map((v) => <PriorityChip key={v} value={v} selected={field.value === v} onClick={field.onChange} disabled={isViewer} />)}</div>)} /></div>
      <div className="grid grid-cols-2 gap-3">
        <Controller name="assignee_id" control={control} render={({ field }) => <MemberDropdown label="Assignee" members={members} value={field.value} onChange={field.onChange} disabled={isViewer} />} />
        <Controller name="category_id" control={control} render={({ field }) => <CategoryDropdown label="Category" categories={categories} value={field.value} onChange={field.onChange} disabled={isViewer} />} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Controller name="start_date" control={control} render={({ field }) => <AdvancedDatePicker label="Start" value={field.value} onChange={field.onChange} position="top" />} />
        <Controller name="due_date" control={control} render={({ field }) => <AdvancedDatePicker label="Due" value={field.value} onChange={field.onChange} position="top" />} />
        <div className="space-y-1.5"><FieldLabel icon={Clock}>Hrs</FieldLabel><input type="number" step="0.5" min="0.5" disabled={isViewer} className="w-full rounded-xl h-10 px-3 text-sm bg-white/[0.03] border border-white/5 text-slate-200 outline-none focus:border-primary-500/40" {...register('estimated_hours')} /></div>
      </div>
      {!isViewer && (
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 h-9 rounded-xl border border-white/5 text-slate-400 text-[12px] font-semibold hover:bg-white/5 transition-colors">Cancel</button>
          <button type="button" onClick={handleSubmit((data) => onSave({ ...subtask, ...data }))} className="flex-[2] h-9 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-[12px] font-bold transition-colors">{isEditing ? 'Save Changes' : 'Add Subtask'}</button>
        </div>
      )}
    </div>
  )
}

export default function TaskModal({ task, project, workspace, onClose }) {
  const { createTask, updateTask, deleteTask, categories } = useTaskStore()
  const { members, getUserRole } = useWorkspaceStore()
  const { user } = useAuthStore()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSavingSubtasks, setIsSavingSubtasks] = useState(false)
  const [formError, setFormError] = useState('')
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [subtaskEditor, setSubtaskEditor] = useState({ isOpen: false, subtask: null, parent: null })
  const [expandedSubtasks, setExpandedSubtasks] = useState({})
  const [subtasks, setSubtasks] = useState([])
  const [initialSubtaskIds, setInitialSubtaskIds] = useState([])
  const [now, setNow] = useState(() => new Date())
  const isEditing = !!task
  const userRole = getUserRole(user?.id); const isViewer = userRole === 'viewer'; const isAdmin = userRole === 'admin'
  const canEdit = useMemo(() => { if (isViewer) return false; if (isAdmin) return true; if (!isEditing) return true; return task?.created_by?.id === user?.id || task?.assignee?.id === user?.id }, [isAdmin, isViewer, isEditing, task, user?.id])
  const { register, handleSubmit, control, watch, setValue, setError, setFocus, clearErrors, formState: { errors, isSubmitting, isValid } } = useForm({ mode: 'onChange', defaultValues: task ? { title: task.title, description: task.description, status: task.status, priority: task.priority, assignee_id: task.assignee?.id || '', category_id: task.category?.id || '', due_date: task.due_date || '', start_date: task.start_date || '', estimated_hours: task.estimated_hours || '' } : { status: 'todo', priority: 'no_priority' } })
  const startDate = watch('start_date'); const dueDate = watch('due_date'); const estimatedHours = watch('estimated_hours')
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t) }, [])
  const taskHoursLimit = useMemo(() => calculateTaskHoursLimit({ start_date: startDate, due_date: dueDate }, now), [startDate, dueDate, now])
  const estimatedHoursValidationMessage = useMemo(() => { if (taskHoursLimit.limitHours === null) return ''; const parsed = Number(estimatedHours); if (!Number.isFinite(parsed) || parsed <= 0) return ''; return parsed > taskHoursLimit.limitHours ? (taskHoursLimit.isSameDay ? 'Exceeds remaining time today' : 'Exceeds task duration') : '' }, [estimatedHours, taskHoursLimit])
  useEffect(() => {
    let active = true
    const normalize = (items = []) => !items.length ? [] : hydrateParentTempKeys(flattenSubtasks(items))
    const load = async () => {
      if (!isEditing) { setSubtasks([]); setInitialSubtaskIds([]); return }
      const inline = Array.isArray(task?.subtasks) ? task.subtasks : []
      if (inline.length > 0) { const n = normalize(inline); if (active) { setSubtasks(n); setInitialSubtaskIds(n.filter((i) => i.id).map((i) => i.id)) }; return }
      try { const { data } = await tasksAPI.listSubtasks(task.id); if (!active) return; const n = normalize(data?.results || data || []); setSubtasks(n); setInitialSubtaskIds(n.filter((i) => i.id).map((i) => i.id)) }
      catch { if (active) { setSubtasks([]); setInitialSubtaskIds([]) } }
    }
    load(); return () => { active = false }
  }, [isEditing, task])
  useEffect(() => {
    const withChildren = new Set(); subtasks.forEach((item) => { const pk = item.parent_id || item.parent_temp_key; if (pk) withChildren.add(pk) })
    setExpandedSubtasks((prev) => { const next = { ...prev }; withChildren.forEach((k) => { if (next[k] === undefined) next[k] = true }); return next })
  }, [subtasks])
  const nestedSubtasks = useMemo(() => { const byParent = buildChildrenMap(subtasks); return { roots: byParent.get(null) || [], byParent } }, [subtasks])
  const getMemberName = (id) => !id ? 'Unassigned' : members.find((m) => m.user.id === id)?.user.full_name || 'Unassigned'
  const getCategoryName = (id) => !id ? 'No category' : categories.find((c) => c.id === id)?.name || 'No category'
  const openSubtaskEditor = (parent = null, edit = null) => setSubtaskEditor({ isOpen: true, parent, subtask: edit })
  const closeSubtaskEditor = () => setSubtaskEditor({ isOpen: false, subtask: null, parent: null })
  const saveSubtaskEditor = (data) => {
    const parentKey = subtaskEditor.parent ? (subtaskEditor.parent.id || subtaskEditor.parent.temp_key) : null
    setSubtasks((prev) => {
      if (subtaskEditor.subtask) { const ek = subtaskEditor.subtask.id || subtaskEditor.subtask.temp_key; return prev.map((item) => (item.id || item.temp_key) === ek ? { ...item, ...data, parent_temp_key: item.parent_temp_key, temp_key: item.temp_key } : item) }
      return [...prev, { id: null, temp_key: makeTempKey(), description: '', status: 'todo', priority: 'no_priority', assignee_id: '', category_id: '', start_date: '', due_date: '', estimated_hours: '', is_completed: false, order: 0, ...data, parent_id: null, parent_temp_key: parentKey }]
    }); closeSubtaskEditor()
  }
  const removeSubtaskRow = (node) => setSubtasks((prev) => { const cm = buildChildrenMap(prev); const keys = collectBranchKeys(node, cm); return prev.filter((item) => !keys.has(item.id || item.temp_key)) })
  const toggleExpanded = (key) => setExpandedSubtasks((prev) => ({ ...prev, [key]: !(prev[key] ?? true) }))
  const toggleComplete = (key) => setSubtasks((prev) => prev.map((item) => (item.id || item.temp_key) === key ? { ...item, is_completed: !item.is_completed } : item))
  const persistNewSubtasks = async (taskId, prepared) => {
    const cMap = new Map(); const pKeys = new Set(prepared.map((i) => i.source_key))
    prepared.forEach((item) => { const pk = item.parent_key || null; if (!cMap.has(pk)) cMap.set(pk, []); cMap.get(pk).push(item) })
    const createBranch = async (parentKey, parentId) => { for (const child of (cMap.get(parentKey) || [])) { const { data } = await tasksAPI.addSubtask(taskId, { task: taskId, title: child.title, description: stripHtml(child.description), status: child.status, priority: child.priority, assignee_id: child.assignee_id, category_id: child.category_id, start_date: child.start_date, due_date: child.due_date, estimated_hours: child.estimated_hours, is_completed: child.is_completed, order: child.order, parent_id: parentId }); await createBranch(child.source_key, data.id) } }
    for (const [pk] of cMap) { if (pk === null || !pKeys.has(pk)) await createBranch(pk, pk) }
  }
  const onSubmit = async (data) => {
    try {
      setFormError(''); clearErrors()
      const validation = validateTask(data, { project, referenceDate: now })
      if (!validation.isValid) { setFormError(validation.generalError || 'Please fix the errors below'); Object.entries(validation.errors).forEach(([f, m]) => setError(f, { type: 'manual', message: m })); const first = Object.keys(validation.errors)[0]; if (first) setFocus(first); return }
      const cleanedSubtasks = normalizeSubtasksForSave(subtasks)
      const payload = { ...data, workspace: workspace.id, project: project?.id || null, title: (data.title || '').trim(), description: stripHtml(data.description), assignee_id: data.assignee_id || null, category_id: data.category_id || null, estimated_hours: data.estimated_hours || null, ...(!isEditing ? { subtasks_input: toNestedSubtasksInput(cleanedSubtasks) } : {}) }
      if (isEditing) {
        await updateTask(task.id, payload); setIsSavingSubtasks(true)
        const existing = cleanedSubtasks.filter((s) => Boolean(s.id)); const incomingIds = new Set(existing.map((s) => s.id)); const removedIds = initialSubtaskIds.filter((id) => !incomingIds.has(id)); const newlyAdded = cleanedSubtasks.filter((s) => !s.id)
        await Promise.all([...existing.map((s) => tasksAPI.updateSubtask(s.id, { title: s.title, description: stripHtml(s.description), status: s.status, priority: s.priority, assignee_id: s.assignee_id, category_id: s.category_id, start_date: s.start_date, due_date: s.due_date, estimated_hours: s.estimated_hours, is_completed: s.is_completed, order: s.order, parent_id: s.parent_key })), ...removedIds.map((id) => tasksAPI.deleteSubtask(id))])
        if (newlyAdded.length > 0) await persistNewSubtasks(task.id, newlyAdded)
        toast.success('Task updated!')
      } else { await createTask(payload); toast.success('Task created!') }
      onClose()
    } catch (err) { const msg = extractApiError(err, 'Failed to save task'); setFormError(msg); toast.error(msg) }
    finally { setIsSavingSubtasks(false) }
  }
  const confirmDelete = async () => { setIsDeleting(true); try { await deleteTask(task.id); toast.success('Task deleted!'); onClose() } catch { toast.error('Failed to delete task'); setIsDeleting(false); setShowDeleteConfirm(false) } }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-base font-semibold text-white flex items-center gap-2"><ListTodo size={16} className="text-primary-400" />{isEditing ? 'Edit Task' : 'New Task'}{isViewer && <span className="text-[10px] font-bold text-slate-500 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full uppercase tracking-widest">Read Only</span>}</h2>
          <div className="flex items-center gap-1">
            {isEditing && canEdit && <button type="button" onClick={() => setShowDeleteConfirm(true)} className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"><Trash2 size={15} /></button>}
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-colors"><X size={15} /></button>
          </div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {formError && <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-xs text-rose-400">{formError}</div>}
            <div className="space-y-1">
              <input className={`w-full bg-transparent border-none text-xl font-bold text-white placeholder:text-slate-700 outline-none ${errors.title ? 'text-rose-400' : ''}`} placeholder="Task title..." disabled={!canEdit} autoFocus {...register('title', { required: 'Title is required' })} />
              <div className="h-px bg-gradient-to-r from-white/10 to-transparent" />
              {errors.title && <p className="text-[10px] text-rose-400 ml-1">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <FieldLabel icon={AlignLeft}>Description</FieldLabel>
              <Controller name="description" control={control} rules={{ required: 'Description is required' }} render={({ field }) => (
                <div className={`border rounded-xl overflow-hidden [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-white/5 [&_.ql-toolbar]:bg-white/[0.02] [&_.ql-container]:border-none [&_.ql-editor]:min-h-[120px] [&_.ql-editor]:max-h-[180px] [&_.ql-editor]:overflow-y-auto [&_.ql-editor]:text-sm [&_.ql-editor]:text-slate-300 [&_.ql-stroke]:stroke-slate-500 [&_.ql-fill]:fill-slate-500 ${!canEdit ? '[&_.ql-toolbar]:hidden' : ''} ${errors.description ? 'border-rose-500/30' : 'border-white/5'}`} style={{ backgroundColor: 'rgba(11,12,16,0.6)' }}>
                  <ReactQuill theme="snow" value={field.value || ''} onChange={field.onChange} placeholder="Describe this task..." readOnly={!canEdit} />
                </div>
              )} />
              {errors.description && <p className="text-[10px] text-rose-400 ml-1">{errors.description.message}</p>}
            </div>
            <div className="space-y-2"><FieldLabel icon={Layers}>Status</FieldLabel><Controller name="status" control={control} render={({ field }) => (<div className="flex gap-1.5">{Object.keys(STATUS_CFG).map((v) => <StatusCard key={v} value={v} selected={field.value === v} onClick={field.onChange} disabled={!canEdit} />)}</div>)} /></div>
            <div className="space-y-2">
              <FieldLabel icon={Flag}>Priority</FieldLabel>
              <Controller name="priority" control={control} rules={{ required: 'Priority is required' }} render={({ field }) => (<div className="flex flex-wrap gap-1.5">{Object.keys(PRIORITY_CFG).map((v) => <PriorityChip key={v} value={v} selected={field.value === v} onClick={field.onChange} disabled={!canEdit} />)}</div>)} />
              {errors.priority && <p className="text-[10px] text-rose-400 ml-1">{errors.priority.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Controller name="assignee_id" control={control} rules={{ required: 'Assignee is required' }} render={({ field }) => <MemberDropdown label="Assignee" members={members} value={field.value} onChange={field.onChange} error={errors.assignee_id?.message} disabled={!canEdit} />} />
              <Controller name="category_id" control={control} rules={{ required: 'Category is required' }} render={({ field }) => <CategoryDropdown label="Category" categories={categories} value={field.value} onChange={field.onChange} error={errors.category_id?.message} disabled={!canEdit} onCreateNew={canEdit ? () => setShowCreateCategory(true) : undefined} />} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Controller name="start_date" control={control} rules={{ required: 'Required' }} render={({ field }) => <AdvancedDatePicker label="Start Date" value={field.value} onChange={field.onChange} error={errors.start_date?.message} />} />
              <Controller name="due_date" control={control} rules={{ required: 'Required', validate: (v) => !v || !startDate || v >= startDate || 'Must be after start date' }} render={({ field }) => <AdvancedDatePicker label="Due Date" value={field.value} onChange={field.onChange} error={errors.due_date?.message} />} />
              <div className="space-y-1.5">
                <FieldLabel icon={Clock}>Est. Hours</FieldLabel>
                <div className="relative">
                  <input type="number" step="0.5" min="0.5" disabled={!canEdit} className={`w-full rounded-xl h-10 pl-3 pr-8 text-sm bg-white/[0.03] border text-slate-200 outline-none focus:border-primary-500/40 transition-all ${errors.estimated_hours || estimatedHoursValidationMessage ? 'border-rose-500/30' : 'border-white/5'}`} placeholder="0" {...register('estimated_hours', { validate: (v) => !v || Number(v) > 0 || 'Must be positive' })} />
                  {canEdit && (<div className="absolute right-1 top-1 bottom-1 flex flex-col gap-px"><button type="button" onClick={() => setValue('estimated_hours', (Number(estimatedHours) || 0) + 0.5, { shouldValidate: true })} className="flex-1 px-1 rounded-md bg-white/[0.03] hover:bg-white/[0.08] text-slate-500 hover:text-white transition-all flex items-center justify-center border border-white/5"><ChevronUp size={10} /></button><button type="button" onClick={() => { const v = Number(estimatedHours) || 0; if (v > 0.5) setValue('estimated_hours', v - 0.5, { shouldValidate: true }) }} className="flex-1 px-1 rounded-md bg-white/[0.03] hover:bg-white/[0.08] text-slate-500 hover:text-white transition-all flex items-center justify-center border border-white/5"><ChevronDown size={10} /></button></div>)}
                </div>
                {(errors.estimated_hours || estimatedHoursValidationMessage) && <p className="text-[10px] text-rose-400 ml-1">{errors.estimated_hours?.message || estimatedHoursValidationMessage}</p>}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FieldLabel icon={ListTodo}>Subtasks{subtasks.length > 0 && <span className="ml-1 text-slate-600 normal-case font-normal">({subtasks.filter((s) => s.is_completed).length}/{subtasks.length})</span>}</FieldLabel>
                {canEdit && !subtaskEditor.isOpen && (<button type="button" onClick={() => openSubtaskEditor(null, null)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 hover:border-primary-500/30 hover:bg-primary-500/5 text-slate-400 hover:text-primary-300 text-[11px] font-semibold transition-all"><Plus size={12} /> Add Subtask</button>)}
              </div>
              {subtaskEditor.isOpen && <SubtaskInlineEditor subtask={subtaskEditor.subtask} parentLabel={subtaskEditor.parent?.title} members={members} categories={categories} isViewer={isViewer} onSave={saveSubtaskEditor} onClose={closeSubtaskEditor} />}
              {nestedSubtasks.roots.length > 0 ? (
                <div className="space-y-1.5">{nestedSubtasks.roots.map((node) => <SubtaskRow key={node.id || node.temp_key} node={node} depth={0} byParent={nestedSubtasks.byParent} expanded={expandedSubtasks} onToggle={toggleExpanded} onEdit={(n) => openSubtaskEditor(null, n)} onAddChild={(n) => openSubtaskEditor(n, null)} onRemove={removeSubtaskRow} onToggleComplete={toggleComplete} getMemberName={getMemberName} getCategoryName={getCategoryName} isViewer={isViewer} />)}</div>
              ) : !subtaskEditor.isOpen && <div className="flex items-center justify-center py-6 rounded-xl border border-dashed border-white/5 text-slate-600 text-xs">No subtasks yet</div>}
            </div>
          </div>
          <div className="flex-shrink-0 flex gap-3 px-6 py-4 border-t border-white/5">
            <button type="button" onClick={onClose} className="flex-1 h-10 rounded-xl border border-white/5 text-slate-400 text-sm font-semibold hover:bg-white/5 transition-colors">Cancel</button>
            {canEdit && (<button type="submit" disabled={isSubmitting || isSavingSubtasks || !isValid} className="flex-[2] h-10 rounded-xl bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:pointer-events-none text-white text-sm font-bold transition-colors flex items-center justify-center gap-2">{(isSubmitting || isSavingSubtasks) && <Loader2 size={14} className="animate-spin" />}{isEditing ? 'Save Changes' : 'Create Task'}</button>)}
          </div>
        </form>
      </div>
      <ConfirmModal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={confirmDelete} title="Delete Task?" message={`"${task?.title}" and all its subtasks will be permanently deleted.`} confirmText="Delete" isDanger isLoading={isDeleting} />
      {showCreateCategory && <CreateCategoryModal workspaceId={workspace?.id} onClose={() => setShowCreateCategory(false)} />}
    </div>
  )
}