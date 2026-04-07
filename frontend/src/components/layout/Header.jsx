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
    return activeWorkspace?.name || 'Takify'
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
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 bg-surface-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-500 text-sm w-48">
          <Grid size={20} className="text-primary-400" />
          <span className="font-bold text-lg text-white">TaskForge</span>
        </div>
        <kbd className="text-xs bg-surface-700 px-1.5 py-0.5 rounded text-slate-600 font-mono">⌘K</kbd>
        <button className="relative p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-surface-800 transition-all">
          <Bell size={16} />
        </button>
      </div>
    </header>
  )
}
