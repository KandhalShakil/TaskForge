import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom'
import {
  LayoutDashboard, FolderKanban, Plus, Settings, ChevronDown,
  ChevronRight, Users, BarChart2, Loader2, Hash, LogOut, MessagesSquare,
  Layers, ChevronLeft, X
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useProjectStore } from '../../store/projectStore'
import UserDropdown from './UserDropdown'
import CreateWorkspaceModal from '../workspace/CreateWorkspaceModal'
import CreateProjectModal from '../project/CreateProjectModal'
import CreateSpaceModal from '../project/CreateSpaceModal'
import CreateFolderModal from '../project/CreateFolderModal'

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { workspaceId, projectId } = useParams()

  const { user, logout } = useAuthStore()
  const { workspaces, activeWorkspace, fetchWorkspaces, setActiveWorkspace, getUserRole } = useWorkspaceStore()
  const {
    hierarchy,
    folderProjects,
    folderProjectsLoading,
    fetchHierarchy,
    fetchProjectsByFolder,
  } = useProjectStore()

  const userRole = getUserRole(user?.id)
  const isViewer = userRole === 'viewer'
  const isAdmin = userRole === 'admin'

  const [collapsed, setCollapsed] = useState(false)
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false)
  const [showSpaceModal, setShowSpaceModal] = useState(false)
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [selectedSpaceIdForCreate, setSelectedSpaceIdForCreate] = useState(null)
  const [selectedFolderIdForCreate, setSelectedFolderIdForCreate] = useState(null)
  const [workspacesExpanded, setWorkspacesExpanded] = useState(true)
  const [spacesExpanded, setSpacesExpanded] = useState(false)
  const [expandedSpaces, setExpandedSpaces] = useState({})
  const [expandedFolders, setExpandedFolders] = useState({})

  const isCompany = user?.user_type === 'owner' || user?.is_staff

  useEffect(() => {
    fetchWorkspaces()
  }, [])

  useEffect(() => {
    if (activeWorkspace) {
      fetchHierarchy(activeWorkspace.id)
    }
  }, [activeWorkspace?.id])

  useEffect(() => {
    if (!activeWorkspace?.id || hierarchy.length === 0) {
      return
    }

    hierarchy.forEach((space) => {
      ;(space.folders || []).forEach((folder) => {
        const isOpen = expandedFolders[folder.id] ?? false
        const hasCache = Array.isArray(folderProjects[folder.id])
        const isLoading = Boolean(folderProjectsLoading[folder.id])

        if (isOpen && !hasCache && !isLoading) {
          fetchProjectsByFolder({
            workspaceId: activeWorkspace.id,
            folderId: folder.id,
            debug: import.meta.env.DEV,
          }).catch(() => {
            // Keep graceful UI fallback to hierarchy data when folder fetch fails.
          })
        }
      })
    })
  }, [activeWorkspace?.id, hierarchy, expandedFolders, folderProjects, folderProjectsLoading])

  const toggleSpaceExpanded = (spaceId) => {
    setExpandedSpaces((prev) => ({ ...prev, [spaceId]: !prev[spaceId] }))
  }

  const toggleFolderExpanded = async (folderId) => {
    const willOpen = !(expandedFolders[folderId] ?? true)
    setExpandedFolders((prev) => ({ ...prev, [folderId]: willOpen }))

    if (willOpen && activeWorkspace?.id) {
      try {
        await fetchProjectsByFolder({
          workspaceId: activeWorkspace.id,
          folderId,
          debug: import.meta.env.DEV,
        })
      } catch {
        // Keep graceful UI fallback to hierarchy data when folder fetch fails.
      }
    }
  }

  const handleHierarchyRefresh = async () => {
    if (activeWorkspace?.id) {
      await fetchHierarchy(activeWorkspace.id)
    }
  }

  const handleLogout = () => {
    logout()
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

      <div 
        className={`
          fixed inset-y-0 left-0 lg:static z-[1000]
          w-64 border-r flex flex-col 
          transition-all duration-300 ease-in-out overflow-hidden
          ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-main)' }}
      >
        {/* Logo Area */}
        <div 
          className="p-5 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--border-light)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Layers size={18} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-white tracking-tight leading-tight">{user?.company_name || 'TaskForge'}</span>
              <span className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mt-0.5">{user?.user_type === 'owner' ? 'Owner' : 'Member'}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
            >
              <X size={20} />
            </button>
            <button
              onClick={() => setCollapsed(true)}
              className="hidden lg:flex btn-ghost"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Workspaces section */}
          <div>
            <div
              className="flex items-center justify-between w-full px-2 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] cursor-pointer hover:text-slate-300 transition-colors"
              onClick={() => setWorkspacesExpanded(!workspacesExpanded)}
            >
              <span>Workspaces</span>
              <div className="flex items-center gap-2">
                {isCompany && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowWorkspaceModal(true) }}
                    className="p-1 rounded bg-slate-800/50 hover:bg-primary-600 hover:text-white transition-all"
                  >
                    <Plus size={10} />
                  </button>
                )}
                {workspacesExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
              </div>
            </div>

            {workspacesExpanded && (
              <div className="mt-1 space-y-0.5">
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      setActiveWorkspace(ws)
                      navigate('/workspaces')
                    }}
                    className={`sidebar-item w-full ${activeWorkspace?.id === ws.id ? 'sidebar-item-active' : ''}`}
                  >
                    <span className="text-base">{ws.icon}</span>
                    <span className="truncate">{ws.name}</span>
                    {ws.user_role === 'admin' && activeWorkspace?.id === ws.id && (
                      <span className="ml-auto text-[9px] font-black text-primary-500/80 uppercase">admin</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Active workspace nav */}
          {activeWorkspace && (
            <div className="space-y-1">
              <div className="px-2 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">
                {activeWorkspace.name}
              </div>

              <Link
                to={`/workspaces/${activeWorkspace.id}/dashboard`}
                className={`sidebar-item ${isActive(`/workspaces/${activeWorkspace.id}/dashboard`) ? 'sidebar-item-active' : ''}`}
              >
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </Link>

              <Link
                to={`/workspaces/${activeWorkspace.id}/members`}
                className={`sidebar-item ${isActive(`/workspaces/${activeWorkspace.id}/members`) ? 'sidebar-item-active' : ''}`}
              >
                <Users size={16} />
                <span>Members</span>
              </Link>

              <Link
                to={`/workspaces/${activeWorkspace.id}/chat`}
                className={`sidebar-item ${isActive(`/workspaces/${activeWorkspace.id}/chat`) ? 'sidebar-item-active' : ''}`}
              >
                <MessagesSquare size={16} />
                <span>Chat</span>
              </Link>

              <div className="divider" />

              {/* Projects */}
              <div>
                <div
                  className="flex items-center justify-between w-full px-2 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] cursor-pointer hover:text-slate-300 transition-colors"
                  onClick={() => setSpacesExpanded(!spacesExpanded)}
                >
                  <span>Spaces</span>
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setShowSpaceModal(true) }}
                        className="p-1 rounded bg-slate-800/50 hover:bg-primary-600 hover:text-white transition-all"
                      >
                        <Plus size={10} />
                      </button>
                    )}
                    {spacesExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                  </div>
                </div>

                {spacesExpanded && (
                  <div className="space-y-1 mt-1">
                  {hierarchy.map((space) => {
                    const isSpaceOpen = expandedSpaces[space.id] ?? false
                    const folders = space.folders || []
                    const rootLists = space.lists || []

                    return (
                      <div key={space.id} className="space-y-1">
                        <div
                          onClick={() => toggleSpaceExpanded(space.id)}
                          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-slate-800/40 transition-all cursor-pointer group/space"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="transition-transform group-hover/space:scale-110">
                              {isSpaceOpen ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
                            </span>
                            <span className="text-lg leading-none">{space.icon || '🧭'}</span>
                            <span className="truncate font-bold tracking-tight">{space.name}</span>
                          </div>
                          
                          {isAdmin && (
                            <div className="flex items-center gap-1 opacity-0 group-hover/space:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => {
                                  setSelectedSpaceIdForCreate(space.id)
                                  setShowFolderModal(true)
                                }}
                                className="p-1.5 rounded-lg bg-primary-600/10 text-primary-400 hover:bg-primary-600 hover:text-white transition-all border border-primary-500/10"
                                title="Add Folder"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          )}
                        </div>

                        {isSpaceOpen && (
                          <div className="pl-6 space-y-1">
                            {rootLists.map((list) => {
                              const listPath = `/workspaces/${activeWorkspace.id}/projects/${list.id}`
                              return (
                                <Link
                                  key={list.id}
                                  to={listPath}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                    isActive(listPath)
                                      ? 'text-slate-100 bg-surface-800 border border-slate-700/70'
                                      : 'text-slate-400 hover:text-slate-100 hover:bg-surface-800'
                                  }`}
                                >
                                  <Hash size={12} />
                                  <span className="truncate">{list.name}</span>
                                  <span className="ml-auto text-[10px] text-slate-600">{list.task_count}</span>
                                </Link>
                              )
                            })}

                            {folders.map((folder) => {
                              const isFolderOpen = expandedFolders[folder.id] ?? false
                              const fallbackFolderLists = folder.lists || folder.projects || []
                              const folderLists = folderProjects[folder.id] || fallbackFolderLists
                              const isFolderLoading = Boolean(folderProjectsLoading[folder.id])

                              return (
                                <div key={folder.id} className="space-y-1">
                                  <div
                                    onClick={() => toggleFolderExpanded(folder.id)}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-slate-100 hover:bg-surface-800 transition-colors cursor-pointer"
                                  >
                                    {isFolderOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                                    <span>{folder.icon || '🗂️'}</span>
                                    <span className="truncate">{folder.name}</span>
                                    {isAdmin && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setSelectedSpaceIdForCreate(space.id)
                                          setSelectedFolderIdForCreate(folder.id)
                                          setShowProjectModal(true)
                                        }}
                                        className="ml-auto p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-surface-700"
                                        title="Create list in folder"
                                      >
                                        <Hash size={12} />
                                      </button>
                                    )}
                                  </div>

                                  {isFolderOpen && (
                                    <div className="pl-6 space-y-1">
                                      {isFolderLoading && (
                                        <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500">
                                          <Loader2 size={12} className="animate-spin" />
                                          <span>Loading lists...</span>
                                        </div>
                                      )}

                                      {folderLists.map((list) => {
                                        const listPath = `/workspaces/${activeWorkspace.id}/projects/${list.id}`
                                        return (
                                          <Link
                                            key={list.id}
                                            to={listPath}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                              isActive(listPath)
                                                ? 'text-slate-100 bg-surface-800 border border-slate-700/70'
                                                : 'text-slate-400 hover:text-slate-100 hover:bg-surface-800'
                                            }`}
                                          >
                                            <Hash size={12} />
                                            <span className="truncate">{list.name}</span>
                                            <span className="ml-auto text-[10px] text-slate-600">{list.task_count}</span>
                                          </Link>
                                        )
                                      })}

                                      {!isFolderLoading && folderLists.length === 0 && (
                                        <div className="text-xs text-slate-600 px-3 py-1.5 italic">No lists</div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            })}

                            {rootLists.length === 0 && folders.length === 0 && (
                               <div className="px-3 py-6 space-y-4">
                                 <div className="flex flex-col items-center text-center gap-2">
                                   <div className="w-10 h-10 rounded-full bg-slate-800/30 flex items-center justify-center text-slate-600 border border-white/5">
                                      <Hash size={16} />
                                   </div>
                                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">No lists yet</p>
                                 </div>
                                 {!isViewer && (
                                   <div className="grid grid-cols-1 gap-2.5">
                                     <button
                                       onClick={() => {
                                         setSelectedSpaceIdForCreate(space.id)
                                         setShowFolderModal(true)
                                       }}
                                       className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-primary-400 bg-primary-500/5 border border-primary-500/10 hover:bg-primary-500/10 transition-all shadow-sm"
                                     >
                                       <Plus size={14} />
                                       Add Folder
                                     </button>
                                     <button
                                       onClick={() => {
                                         setSelectedSpaceIdForCreate(space.id)
                                         setShowProjectModal(true)
                                       }}
                                       className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 bg-slate-800/40 border border-white/5 hover:bg-slate-800/60 transition-all"
                                     >
                                       <Hash size={14} />
                                       Add List
                                     </button>
                                   </div>
                                 )}
                               </div>
                             )}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {hierarchy.length === 0 && (
                    <div className="text-xs text-slate-600 px-3 py-2 italic">No spaces yet</div>
                  )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User footer */}
        <div 
          className="p-4 border-t"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-light)' }}
        >
          <UserDropdown user={user} />
        </div>
      </div>

      {showWorkspaceModal && <CreateWorkspaceModal onClose={() => setShowWorkspaceModal(false)} />}
      {showSpaceModal && activeWorkspace && (
        <CreateSpaceModal
          workspace={activeWorkspace}
          onClose={() => setShowSpaceModal(false)}
          onCreated={handleHierarchyRefresh}
        />
      )}
      {showFolderModal && activeWorkspace && (
        <CreateFolderModal
          workspace={activeWorkspace}
          defaultSpaceId={selectedSpaceIdForCreate}
          onClose={() => setShowFolderModal(false)}
          onCreated={handleHierarchyRefresh}
        />
      )}
      {showProjectModal && activeWorkspace && (
        <CreateProjectModal
          workspace={activeWorkspace}
          defaultSpaceId={selectedSpaceIdForCreate}
          defaultFolderId={selectedFolderIdForCreate}
          onClose={() => {
            setShowProjectModal(false)
            setSelectedSpaceIdForCreate(null)
            setSelectedFolderIdForCreate(null)
            handleHierarchyRefresh()
          }}
        />
      )}
    </>
  )
}
