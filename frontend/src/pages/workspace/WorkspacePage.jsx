import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Settings, Users, FolderKanban, Loader2, ExternalLink, LayoutDashboard, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useProjectStore } from '../../store/projectStore'
import CreateWorkspaceModal from '../../components/workspace/CreateWorkspaceModal'
import CreateProjectModal from '../../components/project/CreateProjectModal'
import Skeleton from '../../components/common/Skeleton'
import ConfirmModal from '../../components/common/ConfirmModal'
import { useAuthStore } from '../../store/authStore'
import Button from '../../components/common/Button'

export default function WorkspacePage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { workspaces, activeWorkspace, fetchWorkspaces, setActiveWorkspace, deleteWorkspace, isSubmitting } = useWorkspaceStore()
  const { projects, fetchProjects, loading: projectsLoading } = useProjectStore()
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [workspaceToDelete, setWorkspaceToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (workspaces.length === 0) {
      fetchWorkspaces()
    }
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

  return (
    <div className="app-container py-6 sm:py-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Workspaces</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your workspaces and projects</p>
        </div>
        {user?.user_type !== 'employee' && (
          <Button onClick={() => setShowWorkspaceModal(true)} icon={Plus}>
            New Workspace
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workspace list */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1 mb-3">Your Workspaces</h2>
          
          {useWorkspaceStore.getState().loading && workspaces.length === 0 ? (
            // Workspace Skeletons
            [1, 2, 3].map((i) => (
              <div key={i} className="card p-4 flex gap-3">
                <Skeleton variant="rect" width="40px" height="40px" className="rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" height="10px" />
                </div>
              </div>
            ))
          ) : (
            <>
              {workspaces.map((ws) => (
                <div
                  key={ws.id}
                  onClick={() => handleSelectWorkspace(ws)}
                  className={`card p-4 cursor-pointer transition-all duration-150 ${
                    activeWorkspace?.id === ws.id
                      ? 'border-primary-700 bg-primary-950/30'
                      : 'hover:border-slate-700 hover:bg-surface-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ backgroundColor: ws.color + '30' }}
                    >
                      {ws.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{ws.name}</p>
                      {ws.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{ws.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Users size={11} /> {ws.member_count} members
                        </span>
                        <span className="badge"
                          style={{
                            background: ws.user_role === 'admin' ? '#4338ca30' : '#1e293b',
                            color: ws.user_role === 'admin' ? '#818cf8' : '#64748b'
                          }}
                        >
                          {ws.user_role}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/workspaces/${ws.id}/members`) }}
                        className="p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-surface-700 transition-all"
                        title="Manage members"
                      >
                        <Users size={13} />
                      </button>
                      {ws.user_role === 'admin' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setWorkspaceToDelete(ws) }}
                          className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-all font-bold"
                          title="Delete workspace"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {workspaces.length === 0 && !useWorkspaceStore.getState().loading && (
                <div className="card p-10 text-center flex flex-col items-center border-dashed border-2 border-slate-800 bg-transparent">
                  <div className="w-16 h-16 rounded-2xl bg-surface-800 flex items-center justify-center mb-4 text-slate-500">
                    <LayoutDashboard size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">No Workspaces</h3>
                  <p className="text-slate-500 text-sm mb-6 max-w-[200px] mx-auto">Create your first workspace to start organizing your projects and team.</p>
                  {user?.user_type !== 'employee' && (
                    <Button 
                      onClick={() => setShowWorkspaceModal(true)} 
                      icon={Plus}
                      className="shadow-lg shadow-primary-900/20"
                    >
                      Create Workspace
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Projects panel */}
        <div className="lg:col-span-2">
          {activeWorkspace ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: activeWorkspace.color + '30' }}
                  >
                    {activeWorkspace.icon}
                  </div>
                  <div>
                    <h2 className="font-semibold text-white">{activeWorkspace.name}</h2>
                    <p className="text-xs text-slate-500">{projects.length} projects</p>
                  </div>
                </div>
                {activeWorkspace?.user_role !== 'viewer' && (
                  <Button onClick={() => setShowProjectModal(true)} icon={Plus} size="sm">
                    New Project
                  </Button>
                )}
              </div>

              {projectsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="card p-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <Skeleton variant="rect" width="36px" height="36px" className="rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton variant="text" width="70%" />
                          <Skeleton variant="text" width="40%" height="10px" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Skeleton variant="rect" width="60px" height="20px" />
                        <Skeleton variant="rect" width="60px" height="20px" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="card-hover p-5 group"
                      onClick={() => navigate(`/workspaces/${activeWorkspace.id}/projects/${project.id}`)}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                          style={{ backgroundColor: project.color + '30' }}
                        >
                          {project.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white truncate group-hover:text-primary-300 transition-colors">
                            {project.name}
                          </h3>
                          {project.description && (
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{project.description}</p>
                          )}
                        </div>
                        <ExternalLink size={14} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><FolderKanban size={11} /> {project.task_count} tasks</span>
                        <span className="flex items-center gap-1"><Users size={11} /> {project.member_count}</span>
                        <span
                          className={`badge ml-auto ${
                            project.status === 'active' ? 'bg-green-900/30 text-green-400'
                            : project.status === 'completed' ? 'bg-blue-900/30 text-blue-400'
                            : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {project.status}
                        </span>
                      </div>
                    </div>
                  ))}

                  {projects.length === 0 && (
                    <div className="col-span-2 card p-16 text-center flex flex-col items-center border-dashed border-2 border-slate-800 bg-transparent">
                      <div className="w-20 h-20 rounded-3xl bg-surface-800 flex items-center justify-center mb-6 text-slate-600">
                        <FolderKanban size={40} />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Workspace is Empty</h3>
                      <p className="text-slate-500 text-sm mb-8 max-w-sm mx-auto">
                        This workspace doesn't have any projects yet. Projects help you group tasks and keep your team focused on specific goals.
                      </p>
                      {activeWorkspace?.user_role !== 'viewer' && (
                        <Button 
                          onClick={() => setShowProjectModal(true)} 
                          icon={Plus} 
                          size="lg"
                          className="px-8 shadow-xl shadow-primary-900/20"
                        >
                          Create Your First Project
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="card p-20 text-center h-full flex items-center justify-center flex-col border-dashed border-2 border-slate-800 bg-transparent">
              <div className="w-24 h-24 rounded-full bg-surface-900 flex items-center justify-center mb-8 relative">
                <LayoutDashboard size={48} className="text-slate-700" />
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-lg">
                  <ChevronRight size={24} />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Welcome to TaskForge</h2>
              <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
                Select a workspace from the list on the left to view its associated projects and start managing your team's workflow.
              </p>
            </div>
          )}
        </div>
      </div>

      {showWorkspaceModal && <CreateWorkspaceModal onClose={() => setShowWorkspaceModal(false)} />}
      {showProjectModal && activeWorkspace && (
        <CreateProjectModal workspace={activeWorkspace} onClose={() => setShowProjectModal(false)} />
      )}

      <ConfirmModal
        isOpen={!!workspaceToDelete}
        onClose={() => setWorkspaceToDelete(null)}
        onConfirm={handleDeleteWorkspace}
        title="Delete Workspace?"
        message={`Are you sure you want to delete "${workspaceToDelete?.name}"? All projects and tasks within this workspace will be permanently removed. This action cannot be undone.`}
        confirmText="Delete Workspace"
        isDanger={true}
        isLoading={isDeleting}
      />
    </div>
  )
}
