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
        className="relative w-full max-w-xl border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-main)', backdropFilter: 'blur(32px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'var(--border-main)' }}>
          <Search size={20} style={{ color: 'var(--text-muted)' }} />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-lg outline-none"
            style={{ color: 'var(--text-main)', caretColor: 'var(--primary-main)' }}
            placeholder="Search workspaces, projects, or actions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div 
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-bold"
            style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border-main)', color: 'var(--text-muted)' }}
          >
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
                      ? 'text-white shadow-lg' 
                      : 'hover:bg-opacity-50'
                  }`}
                  style={{ 
                    backgroundColor: index === selectedIndex ? 'var(--primary-main)' : 'transparent',
                    boxShadow: index === selectedIndex ? '0 10px 20px -10px var(--primary-glow)' : 'none'
                  }}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div 
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: index === selectedIndex ? 'rgba(255,255,255,0.2)' : 'var(--bg-page)' }}
                  >
                    {item.type === 'workspace' && <span className="text-lg">{item.icon}</span>}
                    {item.type === 'project' && <span className="text-lg">{item.icon}</span>}
                    {item.type === 'action' && item.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <p 
                      className="font-semibold" 
                      style={{ color: index === selectedIndex ? 'white' : 'var(--text-main)' }}
                    >
                      {item.name}
                    </p>
                    <p 
                      className="text-xs uppercase tracking-widest font-bold mt-0.5"
                      style={{ color: index === selectedIndex ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}
                    >
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
        <div 
          className="px-5 py-3 border-t flex items-center justify-between text-[10px] uppercase font-bold tracking-widest"
          style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border-main)', color: 'var(--text-muted)' }}
        >
          <div className="flex items-center gap-4">
            <span 
              className="flex items-center gap-1.5 px-2 py-1 rounded-md border"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-main)' }}
            >
              <ChevronRight size={10} className="rotate-90" />
              Navigate
            </span>
            <span 
              className="flex items-center gap-1.5 px-2 py-1 rounded-md border"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-main)' }}
            >
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
