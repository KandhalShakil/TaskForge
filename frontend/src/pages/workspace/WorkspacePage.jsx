import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Settings, Users, FolderKanban, Loader2, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useProjectStore } from '../../store/projectStore'
import CreateWorkspaceModal from '../../components/workspace/CreateWorkspaceModal'
import CreateProjectModal from '../../components/project/CreateProjectModal'

export default function WorkspacePage() {
  const navigate = useNavigate()
  const { workspaces, activeWorkspace, fetchWorkspaces, setActiveWorkspace, deleteWorkspace } = useWorkspaceStore()
  const { projects, fetchProjects, loading: projectsLoading } = useProjectStore()
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)

  useEffect(() => {
    fetchWorkspaces()
  }, [])

  useEffect(() => {
    if (activeWorkspace) fetchProjects(activeWorkspace.id)
  }, [activeWorkspace?.id])

  const handleSelectWorkspace = (ws) => {
    setActiveWorkspace(ws)
  }

  const handleDeleteWorkspace = async (ws) => {
    if (!confirm(`Delete workspace "${ws.name}"? This cannot be undone.`)) return
    try {
      await deleteWorkspace(ws.id)
      toast.success('Workspace deleted')
    } catch {
      toast.error('Failed to delete workspace')
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Workspaces</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your workspaces and projects</p>
        </div>
        <button onClick={() => setShowWorkspaceModal(true)} className="btn-primary">
          <Plus size={16} /> New Workspace
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workspace list */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1 mb-3">Your Workspaces</h2>
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
                      onClick={(e) => { e.stopPropagation(); handleDeleteWorkspace(ws) }}
                      className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-all"
                      title="Delete workspace"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {workspaces.length === 0 && (
            <div className="card p-8 text-center">
              <div className="text-4xl mb-3">🏢</div>
              <p className="text-slate-400 font-medium">No workspaces yet</p>
              <p className="text-slate-600 text-sm mt-1">Create your first workspace to get started</p>
              <button onClick={() => setShowWorkspaceModal(true)} className="btn-primary mt-4 mx-auto">
                <Plus size={14} /> Create Workspace
              </button>
            </div>
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
                <button onClick={() => setShowProjectModal(true)} className="btn-primary">
                  <Plus size={14} /> New Project
                </button>
              </div>

              {projectsLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="animate-spin text-primary-500" size={24} />
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
                    <div className="col-span-2 card p-10 text-center">
                      <div className="text-4xl mb-3">📁</div>
                      <p className="text-slate-400 font-medium">No projects yet</p>
                      <p className="text-slate-600 text-sm mt-1">Create your first project in this workspace</p>
                      <button onClick={() => setShowProjectModal(true)} className="btn-primary mt-4 mx-auto">
                        <Plus size={14} /> Create Project
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="card p-10 text-center h-full flex items-center justify-center flex-col">
              <div className="text-4xl mb-3">👈</div>
              <p className="text-slate-400">Select a workspace to view its projects</p>
            </div>
          )}
        </div>
      </div>

      {showWorkspaceModal && <CreateWorkspaceModal onClose={() => setShowWorkspaceModal(false)} />}
      {showProjectModal && activeWorkspace && (
        <CreateProjectModal workspace={activeWorkspace} onClose={() => setShowProjectModal(false)} />
      )}
    </div>
  )
}
