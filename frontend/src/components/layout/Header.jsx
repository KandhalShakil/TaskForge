import { useState } from 'react'
import { useLocation, useParams, Link } from 'react-router-dom'
import { Search, Bell, Command, Grid } from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useProjectStore } from '../../store/projectStore'

export default function Header() {
  const { activeWorkspace } = useWorkspaceStore()
  const { activeProject } = useProjectStore()
  const location = useLocation()

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
    <header className="h-14 bg-surface-900 border-b border-slate-800 flex items-center justify-between px-6 flex-shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-slate-600">/</span>}
            {crumb.to ? (
              <Link to={crumb.to} className="text-slate-400 hover:text-slate-200 transition-colors">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-slate-100 font-medium">{crumb.label}</span>
            )}
          </span>
        ))}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-4">
        {/* TaskForge Badge/Button */}
        <div className="flex items-center gap-2.5 bg-surface-800/50 border border-slate-700/50 hover:border-slate-600/50 hover:bg-surface-800 rounded-xl px-4 py-1.5 transition-all cursor-default group">
          <div className="p-1 rounded-lg bg-primary-500/10 group-hover:bg-primary-500/20 transition-colors">
            <Grid size={18} className="text-primary-400" />
          </div>
          <span className="font-bold text-base text-white tracking-tight">TaskForge</span>
        </div>

        <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
          <kbd className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-400 bg-surface-800 border border-slate-700 rounded-lg shadow-sm">
            <Command size={12} className="text-slate-500" />
            <span className="font-sans">K</span>
          </kbd>

          <button className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-surface-800 border border-transparent hover:border-slate-700/50 transition-all relative group">
            <Bell size={20} className="group-hover:scale-110 transition-transform" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary-500 rounded-full border-2 border-surface-900 shadow-sm" />
          </button>
        </div>
      </div>
    </header>
  )
}
