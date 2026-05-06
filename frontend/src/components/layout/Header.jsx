import { useState, useEffect } from 'react'
import { useLocation, useParams, Link } from 'react-router-dom'
import { Search, Bell, Command, Grid, Mail, Menu, ChevronRight, Hash, Layout, Users } from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useProjectStore } from '../../store/projectStore'
import { useAuthStore } from '../../store/authStore'
import InvitationsModal from '../workspace/InvitationsModal'
import { motion, AnimatePresence } from 'framer-motion'

export default function Header({ onMenuClick }) {
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

  const getBreadcrumbs = () => {
    const crumbs = []
    if (activeWorkspace) {
      crumbs.push({ label: activeWorkspace.name, to: '/workspaces', icon: <Grid size={12} /> })
    }
    if (location.pathname.includes('/dashboard')) {
      crumbs.push({ label: 'Analytics', to: null, icon: <Layout size={12} /> })
    } else if (location.pathname.includes('/members')) {
      crumbs.push({ label: 'Team', to: null, icon: <Users size={12} /> })
    } else if (activeProject && location.pathname.includes('/projects/')) {
      crumbs.push({ label: activeProject.name, to: null, icon: <Hash size={12} /> })
    }
    return crumbs
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <header className="h-16 border-b border-white/5 bg-slate-900/40 backdrop-blur-md flex items-center justify-between px-6 flex-shrink-0 z-40">
      <div className="flex items-center gap-6 min-w-0">
        {/* Mobile Menu Toggle */}
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all border border-white/5 shadow-inner"
        >
          <Menu size={20} />
        </button>

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-sm font-['Outfit'] overflow-hidden">
          <AnimatePresence mode="popLayout">
            {breadcrumbs.map((crumb, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center gap-2 shrink-0 ${!isLast ? 'hidden sm:flex' : 'flex'}`}
                >
                  {i > 0 && <ChevronRight size={12} className="text-slate-700" />}
                  {crumb.to ? (
                    <Link 
                      to={crumb.to} 
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all font-bold uppercase tracking-wider text-[10px]"
                    >
                      {crumb.icon}
                      <span className="hidden xs:inline">{crumb.label}</span>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/5 text-white font-black uppercase tracking-[0.1em] text-[10px] shadow-sm">
                      {crumb.icon}
                      {crumb.label}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {isViewer && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-500 text-[9px] font-black uppercase tracking-widest ml-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
              Viewer Mode
            </div>
          )}
        </nav>
      </div>

      {/* Right Side Controls */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 pr-4 border-r border-white/5">
          {invitations.length > 0 && (
            <button 
              onClick={() => setShowInvitations(true)}
              className="group flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary-500/10 text-primary-400 hover:bg-primary-500 transition-all border border-primary-500/20 hover:text-white shadow-lg shadow-primary-500/10 relative overflow-hidden"
            >
              <Mail size={16} className="group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">{invitations.length} Pending</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </button>
          )}

          <button className="p-2.5 rounded-2xl bg-white/[0.02] text-slate-500 hover:text-white hover:bg-white/[0.05] border border-white/5 transition-all relative group">
            <Bell size={20} className="group-hover:rotate-12 transition-transform" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-slate-900 shadow-sm animate-pulse" />
          </button>
        </div>

        {/* Global Search / Command Bar Placeholder */}
        <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/[0.02] border border-white/5 text-slate-500 cursor-text hover:bg-white/[0.05] hover:border-white/10 transition-all min-w-[200px]">
          <Search size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest flex-1">Quick Search</span>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10">
            <Command size={10} />
            <span className="text-[9px] font-black">K</span>
          </div>
        </div>
      </div>

      {showInvitations && <InvitationsModal onClose={() => setShowInvitations(false)} />}
    </header>
  )
}
