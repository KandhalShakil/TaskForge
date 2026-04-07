import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, Command, LayoutDashboard, FolderKanban, 
  Plus, Users, X, ChevronRight, Hash, FileText
} from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useProjectStore } from '../../store/projectStore'
import { useAuthStore } from '../../store/authStore'

export default function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)

  const { workspaces, setActiveWorkspace } = useWorkspaceStore()
  const { projects } = useProjectStore()
  const { user } = useAuthStore()

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Filter items based on query
  const filteredWorkspaces = workspaces.filter(ws => 
    ws.name.toLowerCase().includes(query.toLowerCase())
  ).map(ws => ({ ...ws, type: 'workspace' }))

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(query.toLowerCase())
  ).map(p => ({ ...p, type: 'project' }))

  const actions = [
    { id: 'new-workspace', name: 'Create New Workspace', type: 'action', icon: <Plus size={16} />, restricted: user?.user_type === 'employee' },
    { id: 'view-members', name: 'Manage Team Members', type: 'action', icon: <Users size={16} /> },
  ].filter(a => !a.restricted && a.name.toLowerCase().includes(query.toLowerCase()))

  const results = [...filteredWorkspaces, ...filteredProjects, ...actions]

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return
      
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % results.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length)
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault()
        handleSelect(results[selectedIndex])
      } else if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex])

  const handleSelect = (item) => {
    if (item.type === 'workspace') {
      setActiveWorkspace(item)
      navigate('/workspaces')
    } else if (item.type === 'project') {
      // Find the workspace this project belongs to (simplified)
      navigate(`/workspaces/${item.workspace}/projects/${item.id}`)
    } else if (item.id === 'new-workspace') {
      navigate('/workspaces')
      // Modal would need to be triggered from a global state or via navigation
    } else if (item.id === 'view-members') {
      if (workspaces.length > 0) {
        navigate(`/workspaces/${workspaces[0].id}/members`)
      }
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-[1000] flex items-start justify-center pt-[15vh] px-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Palette Container */}
      <div 
        className="relative w-full max-w-xl bg-surface-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
          <Search size={20} className="text-slate-500" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-white text-lg outline-none placeholder:text-slate-600"
            placeholder="Search workspaces, projects, or actions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-1.5 px-2 py-1 bg-surface-800 rounded-lg border border-slate-700 text-xs font-bold text-slate-500">
            ESC
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-hide">
          {results.length > 0 ? (
            <div className="space-y-1">
              {results.map((item, index) => (
                <button
                  key={`${item.type}-${item.id}`}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                    index === selectedIndex 
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20' 
                      : 'text-slate-400 hover:bg-surface-800 hover:text-slate-100'
                  }`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    index === selectedIndex ? 'bg-white/20' : 'bg-surface-800'
                  }`}>
                    {item.type === 'workspace' && <span className="text-lg">{item.icon}</span>}
                    {item.type === 'project' && <span className="text-lg">{item.icon}</span>}
                    {item.type === 'action' && item.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`font-semibold ${index === selectedIndex ? 'text-white' : 'text-slate-100'}`}>
                      {item.name}
                    </p>
                    <p className={`text-xs uppercase tracking-widest font-bold mt-0.5 ${
                      index === selectedIndex ? 'text-primary-200' : 'text-slate-500'
                    }`}>
                      {item.type}
                    </p>
                  </div>
                  {index === selectedIndex && (
                    <ChevronRight size={16} className="text-white/70" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500">
              <div className="w-12 h-12 rounded-full bg-surface-800 flex items-center justify-center mx-auto mb-4">
                <Search size={24} />
              </div>
              <p className="font-medium text-slate-400">No results found for "{query}"</p>
              <p className="text-xs text-slate-600 mt-1 uppercase tracking-widest">Try a different search term</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-surface-950/50 border-t border-slate-800 flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 px-2 py-1 bg-surface-800 rounded-md">
              <ChevronRight size={10} className="rotate-90" />
              Navigate
            </span>
            <span className="flex items-center gap-1.5 px-2 py-1 bg-surface-800 rounded-md">
              <Hash size={10} />
              Select
            </span>
          </div>
          <p>TaskForge Search v1.0</p>
        </div>
      </div>
    </div>
  )
}
