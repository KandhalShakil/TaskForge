import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom'
import {
  LayoutDashboard, FolderKanban, Plus, Settings, ChevronDown,
  ChevronRight, Users, BarChart2, Loader2, Hash, LogOut,
  Layers, ChevronLeft
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useProjectStore } from '../../store/projectStore'
import CreateWorkspaceModal from '../workspace/CreateWorkspaceModal'
import CreateProjectModal from '../project/CreateProjectModal'

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { workspaceId, projectId } = useParams()

  const { user, logout } = useAuthStore()
  const { workspaces, activeWorkspace, fetchWorkspaces, setActiveWorkspace, getUserRole } = useWorkspaceStore()
  const { projects, fetchProjects } = useProjectStore()

  const userRole = getUserRole(user?.id)
  const isViewer = userRole === 'viewer'
  const isAdmin = userRole === 'admin'

  const [collapsed, setCollapsed] = useState(false)
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [workspacesExpanded, setWorkspacesExpanded] = useState(true)
  const [projectsExpanded, setProjectsExpanded] = useState(true)

  const isCompany = user?.user_type === 'company' || user?.is_staff

  useEffect(() => {
    fetchWorkspaces()
  }, [])

  useEffect(() => {
    if (activeWorkspace) {
      fetchProjects(activeWorkspace.id)
    }
  }, [activeWorkspace?.id])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  if (collapsed) {
    return (
      <div className="w-14 bg-surface-900 border-r border-slate-800 flex flex-col items-center py-4 gap-2 transition-all duration-200">
        <button
          onClick={() => setCollapsed(false)}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-surface-800 transition-all"
        >
          <ChevronRight size={16} />
        </button>
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-sm mt-2">
          T
        </div>
        {workspaces.slice(0, 5).map((ws) => (
          <button
            key={ws.id}
            onClick={() => { setActiveWorkspace(ws); navigate(`/workspaces`) }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:scale-110 transition-transform"
            style={{ background: ws.color + '30' }}
            title={ws.name}
          >
            {ws.icon}
          </button>
        ))}
      </div>
    )
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[999]" 
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 lg:static z-[1000]
        w-64 bg-surface-900 border-r border-slate-800 flex flex-col 
        transition-all duration-300 ease-in-out overflow-hidden
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-slate-800/50 flex items-center justify-between bg-surface-900/30 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-600/20 border border-primary-500/20 flex items-center justify-center shadow-inner shadow-primary-500/10">
              <LayoutDashboard size={20} className="text-primary-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base text-white tracking-tight leading-none">TaskForge</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1 line-clamp-1">Productivity</span>
            </div>
          </div>
          <button
            onClick={() => setCollapsed(true)}
            className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-surface-800/80 transition-all border border-transparent hover:border-slate-700/50"
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {/* Workspaces section */}
          <div>
            <div
              className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors cursor-pointer"
              onClick={() => setWorkspacesExpanded(!workspacesExpanded)}
            >
              <div className="flex items-center justify-between w-full pr-2">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-2">Workspaces</h2>
                {isCompany && (
                  <button 
                    id="sidebar-create-workspace"
                    onClick={(e) => { e.stopPropagation(); setShowWorkspaceModal(true) }}
                    className="p-1 rounded-md hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1">
                {workspacesExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </div>
            </div>

            {workspacesExpanded && (
              <div className="mt-1 space-y-0.5">
                {workspaces.map((ws) => (
                  <div key={ws.id}>
                    <button
                      onClick={() => {
                        setActiveWorkspace(ws)
                        navigate('/workspaces')
                      }}
                      className={`group flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                        activeWorkspace?.id === ws.id
                          ? 'text-slate-100 bg-surface-800 border border-slate-700/50 shadow-sm shadow-primary-900/10'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-surface-800/80'
                      }`}
                    >
                      <span className="text-base group-hover:scale-125 transition-transform duration-200">{ws.icon}</span>
                      <span className="truncate font-medium">{ws.name}</span>
                      {ws.user_role === 'admin' && (
                        <span className="ml-auto text-[10px] font-bold text-primary-500 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">admin</span>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active workspace nav */}
          {activeWorkspace && (
            <div className="mt-3">
              <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                {activeWorkspace.name}
              </div>

              <Link
                to={`/workspaces/${activeWorkspace.id}/dashboard`}
                className={`sidebar-item ${isActive(`/workspaces/${activeWorkspace.id}/dashboard`) ? 'sidebar-item-active' : ''}`}
              >
                <BarChart2 size={16} />
                <span>Dashboard</span>
              </Link>

              <Link
                to={`/workspaces/${activeWorkspace.id}/members`}
                className={`sidebar-item ${isActive(`/workspaces/${activeWorkspace.id}/members`) ? 'sidebar-item-active' : ''}`}
              >
                <Users size={16} />
                <span>Members</span>
              </Link>

              <div className="divider" />

              {/* Projects */}
              <div
                className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors cursor-pointer"
                onClick={() => setProjectsExpanded(!projectsExpanded)}
              >
                <div className="flex items-center justify-between w-full pr-2 mt-4">
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-2">Projects</h2>
                  {activeWorkspace?.user_role !== 'viewer' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowProjectModal(true) }}
                      className="p-1 rounded-md hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-4">
                  {projectsExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </div>
              </div>

              {projectsExpanded && (
                <div className="space-y-0.5 mt-1">
                  {projects.map((project) => {
                    const projectPath = `/workspaces/${activeWorkspace.id}/projects/${project.id}`
                    return (
                      <Link
                        key={project.id}
                        to={projectPath}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                          isActive(projectPath)
                            ? 'text-slate-100 bg-surface-800 border border-slate-700'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-surface-800'
                        }`}
                      >
                        <span className="text-sm">{project.icon}</span>
                        <span className="truncate">{project.name}</span>
                        <span className="ml-auto text-xs text-slate-600">{project.task_count}</span>
                      </Link>
                    )
                  })}
                  {projects.length === 0 && (
                    <div className="text-xs text-slate-600 px-3 py-2 italic">No projects yet</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User footer */}
        <div className="p-4 border-t border-slate-800/50 bg-surface-900/50">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent hover:border-slate-800 hover:bg-surface-800 transition-all group cursor-default">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0 shadow-lg shadow-primary-900/20 group-hover:scale-105 transition-transform">
              {user?.initials || user?.full_name?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate leading-tight">{user?.full_name}</p>
              <p className="text-[10px] font-medium text-slate-500 truncate uppercase mt-0.5 tracking-wider">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-all opacity-0 group-hover:opacity-100"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      {showWorkspaceModal && <CreateWorkspaceModal onClose={() => setShowWorkspaceModal(false)} />}
      {showProjectModal && activeWorkspace && (
        <CreateProjectModal
          workspace={activeWorkspace}
          onClose={() => setShowProjectModal(false)}
        />
      )}
    </>
  )
}
