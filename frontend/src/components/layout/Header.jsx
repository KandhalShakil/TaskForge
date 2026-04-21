import { useState } from 'react'
import { useLocation, useParams, Link } from 'react-router-dom'
import { Search, Bell, Command, Grid, Mail, Menu } from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useProjectStore } from '../../store/projectStore'
import { useAuthStore } from '../../store/authStore'
import { useEffect } from 'react'
import InvitationsModal from '../workspace/InvitationsModal'

export default function Header({ onMenuClick, onSearchClick }) {
  const { activeWorkspace, getUserRole, invitations, fetchInvitations } = useWorkspaceStore()
  const { activeProject } = useProjectStore()
  const { user } = useAuthStore()
  const location = useLocation()
  const [showInvitations, setShowInvitations] = useState(false)

  useEffect(() => {
    fetchInvitations()
  }, [])

  const userRole = getUserRole(user?.id)
  const isViewer = userRole === 'viewer'

  const getPageTitle = () => {
    if (location.pathname.includes('/dashboard')) return 'Analytics Dashboard'
    if (location.pathname.includes('/members')) return 'Workspace Members'
    if (location.pathname.includes('/projects/') && activeProject) return activeProject.name
    return activeWorkspace?.name || 'TaskForge'
  }

  const getBreadcrumbs = () => {
    const crumbs = []
    if (activeWorkspace) {
      crumbs.push({ label: activeWorkspace.name, to: '/workspaces' })
    }
    if (location.pathname.includes('/dashboard')) {
      crumbs.push({ label: 'Dashboard', to: null })
    } else if (location.pathname.includes('/members')) {
      crumbs.push({ label: 'Members', to: null })
    } else if (activeProject && location.pathname.includes('/projects/')) {
      crumbs.push({ label: activeProject.name, to: null })
    }
    return crumbs
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <header className="h-14 bg-surface-900 border-b border-slate-800 flex items-center justify-between px-3 sm:px-4 lg:px-6 flex-shrink-0">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Menu Toggle */}
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-surface-800 transition-all border border-slate-700/50"
        >
          <Menu size={20} />
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-sm overflow-hidden truncate min-w-0">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-2 flex-shrink min-w-0 animate-in slide-in-from-left-2 duration-300">
              {i > 0 && <span className="text-slate-700 font-bold">/</span>}
              {crumb.to ? (
                <Link 
                  to={crumb.to} 
                  className="text-slate-500 hover:text-slate-200 transition-all font-medium hover:bg-surface-800 px-2 py-1 rounded-lg truncate max-w-[9rem] sm:max-w-none"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-slate-100 font-bold px-2 py-1 truncate max-w-[10rem] sm:max-w-none">{crumb.label}</span>
              )}
            </span>
          ))}
          {isViewer && (
            <span className="hidden sm:inline-flex ml-2 badge bg-slate-800 text-slate-400 text-[10px] uppercase tracking-wider px-2 py-0.5 border border-slate-700/50">
              Read Only
            </span>
          )}
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 sm:gap-4 pl-2">
        {/* TaskForge Badge/Button - Hidden on Mobile */}
        <div className="hidden sm:flex items-center gap-2.5 bg-surface-800/50 border border-slate-700/50 hover:border-slate-600/50 hover:bg-surface-800 rounded-xl px-4 py-1.5 transition-all cursor-default group">
          <div className="p-1 rounded-lg bg-primary-500/10 group-hover:bg-primary-500/20 transition-colors">
            <Grid size={18} className="text-primary-400" />
          </div>
          <span className="font-bold text-base text-white tracking-tight">TaskForge</span>
        </div>

        <div
          onClick={onSearchClick}
          className="flex items-center gap-2 sm:gap-3 border-l border-slate-800 pl-2 sm:pl-4 cursor-pointer group"
        >
          <kbd className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-400 bg-surface-800 border border-slate-700 rounded-lg shadow-sm group-hover:border-primary-500/50 group-hover:text-slate-200 transition-all">
            <Command size={12} className="text-slate-500 group-hover:text-primary-400" />
            <span className="font-sans">K</span>
          </kbd>

          <button className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-surface-800 border border-transparent hover:border-slate-700/50 transition-all relative group">
            <Bell size={20} className="group-hover:scale-110 transition-transform" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary-500 rounded-full border-2 border-surface-900 shadow-sm" />
          </button>

          {invitations.length > 0 && (
            <button 
              onClick={() => setShowInvitations(true)}
<<<<<<< HEAD
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-primary-600/10 text-primary-400 hover:bg-primary-600/20 transition-all border border-primary-500/20 shadow-lg shadow-primary-900/10 animate-fade-in"
=======
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-600/10 text-primary-400 hover:bg-primary-600/20 transition-all border border-primary-500/20 shadow-lg shadow-primary-900/10 animate-fade-in"
>>>>>>> f5a8c18878f09922f4f9e273f7ea6d3fd65193f9
            >
              <Mail size={14} />
              <span className="text-xs font-bold">{invitations.length} <span className="hidden sm:inline">Invites</span></span>
            </button>
          )}
        </div>
      </div>

      {showInvitations && <InvitationsModal onClose={() => setShowInvitations(false)} />}
    </header>
  )
}
