import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Users, FolderKanban, LayoutDashboard, ChevronRight, Briefcase, Search, Filter } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useProjectStore } from '../../store/projectStore'
import CreateWorkspaceModal from '../../components/workspace/CreateWorkspaceModal'
import CreateProjectModal from '../../components/project/CreateProjectModal'
import CreateFolderModal from '../../components/project/CreateFolderModal'
import Skeleton from '../../components/common/Skeleton'
import ConfirmModal from '../../components/common/ConfirmModal'
import { useAuthStore } from '../../store/authStore'
import Button from '../../components/common/Button'

export default function WorkspacePage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { workspaces, activeWorkspace, fetchWorkspaces, setActiveWorkspace, deleteWorkspace } = useWorkspaceStore()
  const { projects, fetchProjects, loading: projectsLoading } = useProjectStore()
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [workspaceToDelete, setWorkspaceToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchWorkspaces()
  }, [])

  useEffect(() => {
    if (activeWorkspace) fetchProjects(activeWorkspace.id)
  }, [activeWorkspace?.id])

  const handleSelectWorkspace = (ws) => {
    setActiveWorkspace(ws)
  }

  const handleDeleteWorkspace = async () => {
    if (!workspaceToDelete) return
    setIsDeleting(true)
    try {
      await deleteWorkspace(workspaceToDelete.id)
      toast.success('Workspace deleted')
      setWorkspaceToDelete(null)
    } catch {
      toast.error('Failed to delete workspace')
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredWorkspaces = workspaces.filter(ws => 
    ws.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex-1 overflow-y-auto bg-page font-['Outfit']">
      <div className="app-container py-10">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Briefcase className="text-primary-500" size={28} />
              Workspaces
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Manage your organization's projects and team members</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-500 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Search workspaces..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10 h-11 bg-slate-900/40 border-white/5 focus:border-primary-500/50"
              />
            </div>
            {user?.user_type !== 'employee' && (
              <Button onClick={() => setShowWorkspaceModal(true)} icon={Plus} className="shadow-lg shadow-primary-500/20">
                New Workspace
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Workspace Selection Column */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between px-2 mb-2">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Your Organization</h2>
              <span className="badge bg-slate-800/50 border-white/5 text-slate-400">{workspaces.length}</span>
            </div>
            
            <div className="space-y-3">
              {useWorkspaceStore.getState().loading && workspaces.length === 0 ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="card p-5 flex gap-4 animate-pulse">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-slate-800 rounded w-2/3" />
                      <div className="h-3 bg-slate-800 rounded w-1/2" />
                    </div>
                  </div>
                ))
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredWorkspaces.map((ws) => (
                    <motion.div
                      layout
                      key={ws.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => handleSelectWorkspace(ws)}
                      className={`card p-5 cursor-pointer transition-all border-2 relative group ${
                        activeWorkspace?.id === ws.id 
                        ? 'border-primary-500/50 bg-primary-500/5 shadow-xl shadow-primary-500/10' 
                        : 'border-white/5 hover:border-white/10 hover:bg-slate-900/40'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center text-2xl shadow-inner">
                          {ws.icon || '🏢'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white truncate text-lg">{ws.name}</h3>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                              <Users size={12} className="text-slate-600" /> {ws.member_count}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                              ws.user_role === 'admin' ? 'border-primary-500/30 text-primary-400 bg-primary-500/5' : 'border-slate-800 text-slate-500'
                            }`}>
                              {ws.user_role}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {ws.user_role === 'admin' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setWorkspaceToDelete(ws) }}
                              className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                          <ChevronRight size={18} className="text-slate-700 mt-1" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}

              {filteredWorkspaces.length === 0 && !useWorkspaceStore.getState().loading && (
                <div className="card p-12 text-center border-dashed border-white/5 bg-transparent">
                  <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mx-auto mb-4 border border-white/5">
                    <Search size={24} className="text-slate-700" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">No workspaces found</h3>
                  <p className="text-sm text-slate-500">Try adjusting your search query</p>
                </div>
              )}
            </div>
          </div>

          {/* Active Projects Panel */}
          <div className="lg:col-span-8">
            {activeWorkspace ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between bg-slate-900/20 p-4 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-xl">
                      {activeWorkspace.icon}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{activeWorkspace.name}</h2>
                      <p className="text-xs text-slate-500 font-medium">{projects.length} Active Projects</p>
                    </div>
                  </div>
                  {activeWorkspace?.user_role !== 'viewer' && (
                    <div className="flex gap-2">
                      <Button onClick={() => setShowFolderModal(true)} icon={Plus} size="sm" variant="secondary" className="h-9">
                        New Folder
                      </Button>
                      <Button onClick={() => setShowProjectModal(true)} icon={Plus} size="sm" className="h-9">
                        New Project
                      </Button>
                    </div>
                  )}
                </div>

                {projectsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="card p-6 h-32 animate-pulse bg-slate-900/20" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map((project) => (
                      <motion.div
                        whileHover={{ y: -4 }}
                        key={project.id}
                        onClick={() => navigate(`/workspaces/${activeWorkspace.id}/projects/${project.id}`)}
                        className="card p-6 cursor-pointer border-white/5 hover:border-primary-500/30 group bg-slate-900/40"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                              {project.icon || '🚀'}
                            </div>
                            <div>
                              <h3 className="font-bold text-white group-hover:text-primary-400 transition-colors">{project.name}</h3>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{project.status}</p>
                            </div>
                          </div>
                          <span className="badge bg-primary-500/10 border-primary-500/20 text-primary-400">
                            {project.task_count} Tasks
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                          <span className="flex items-center gap-1.5"><Users size={12} /> {project.member_count} Members</span>
                          <span className="flex items-center gap-1.5"><FolderKanban size={12} /> List</span>
                        </div>
                      </motion.div>
                    ))}

                    {projects.length === 0 && (
                      <div className="col-span-full card p-20 flex flex-col items-center text-center border-dashed border-white/5 bg-transparent">
                        <div className="w-20 h-20 rounded-3xl bg-slate-900 flex items-center justify-center mx-auto mb-6 border border-white/5">
                          <FolderKanban size={40} className="text-slate-700" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No projects yet</h3>
                        <p className="text-sm text-slate-500 max-w-xs mx-auto mb-8">Create your first project to start organizing tasks and collaborating with your team.</p>
                        {activeWorkspace?.user_role !== 'viewer' && (
                          <Button onClick={() => setShowProjectModal(true)} icon={Plus} size="lg" className="mx-auto">
                            Create First Project
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="card h-[400px] flex flex-col items-center justify-center text-center p-12 border-dashed border-white/5 bg-transparent">
                <div className="w-24 h-24 rounded-full bg-slate-900 flex items-center justify-center mb-8 border border-white/5 relative">
                  <LayoutDashboard size={48} className="text-slate-700" />
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-xl shadow-primary-600/30">
                    <ChevronRight size={20} />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">Select a Workspace</h2>
                <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Choose an organization from the left panel to manage its projects, members, and high-level analytics.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showWorkspaceModal && <CreateWorkspaceModal onClose={() => setShowWorkspaceModal(false)} />}
      {showProjectModal && activeWorkspace && (
        <CreateProjectModal workspace={activeWorkspace} onClose={() => setShowProjectModal(false)} />
      )}
      {showFolderModal && activeWorkspace && (
        <CreateFolderModal 
          workspace={activeWorkspace} 
          onClose={() => setShowFolderModal(false)} 
          onCreated={() => fetchProjects(activeWorkspace.id)} 
        />
      )}

      <ConfirmModal
        isOpen={!!workspaceToDelete}
        onClose={() => setWorkspaceToDelete(null)}
        onConfirm={handleDeleteWorkspace}
        title="Delete Workspace?"
        message={`Are you sure you want to delete "${workspaceToDelete?.name}"? This will permanently remove all associated projects and data.`}
        confirmText="Delete Workspace"
        isDanger={true}
        isLoading={isDeleting}
      />
    </div>
  )
}
