import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, List, Columns, Calendar, GanttChart, Loader2, RefreshCw, Users, Settings, Filter, ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useProjectStore } from '../../store/projectStore'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useTaskStore } from '../../store/taskStore'
import TaskListView from '../../components/tasks/TaskListView'
import TaskModal from '../../components/tasks/TaskModal'
import TaskFilters from '../../components/tasks/TaskFilters'
import Skeleton from '../../components/common/Skeleton'
import { useAuthStore } from '../../store/authStore'
import { connectSocket } from '../../utils/socket'
import Button from '../../components/common/Button'

const KanbanBoard = lazy(() => import('../../components/kanban/KanbanBoard'))
const CalendarView = lazy(() => import('../../components/calendar/CalendarView'))
const TimelineView = lazy(() => import('../../components/timeline/TimelineView'))
const ProjectMembersView = lazy(() => import('../../components/project/ProjectMembersView'))

const VIEW_TABS = [
  { id: 'list', label: 'List', Icon: List },
  { id: 'kanban', label: 'Board', Icon: Columns },
  { id: 'calendar', label: 'Calendar', Icon: Calendar },
  { id: 'timeline', label: 'Timeline', Icon: GanttChart },
  { id: 'members', label: 'Members', Icon: Users },
]

export default function ProjectPage() {
  const navigate = useNavigate()
  const { workspaceId, projectId } = useParams()
  const { activeWorkspace, members, fetchMembers, getUserRole } = useWorkspaceStore()
  const { user } = useAuthStore()
  const { setActiveProject, fetchProjectById } = useProjectStore()
  const { tasks, categories, loading, fetchTasks, fetchCategories, filters } = useTaskStore()

  const userRole = getUserRole(user?.id)
  const isViewer = userRole === 'viewer'

  const [project, setProject] = useState(null)
  const [view, setView] = useState('list')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [projectError, setProjectError] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const notFoundHandledRef = useRef(false)

  const loadTasks = () => {
    fetchTasks({ project: projectId })
  }

  useEffect(() => {
    let isMounted = true
    notFoundHandledRef.current = false // Reset error handling on project change

    if (!projectId) return

    fetchProjectById(projectId)
      .then((projectData) => {
        if (!isMounted) return
        setProject(projectData)
        setActiveProject(projectData)
        setProjectError(false)
      })
      .catch((error) => {
        if (!isMounted) return
        if (error?.response?.status === 404) {
          notFoundHandledRef.current = true
          toast.error('Project not found')
          navigate(workspaceId ? `/workspaces/${workspaceId}` : '/workspaces', { replace: true })
        }
      })

    if (workspaceId) {
      fetchMembers(workspaceId)
      fetchCategories(workspaceId)
    }

    const socket = connectSocket()
    socket.emit('join_project', { projectId, userId: user?.id })

    const onTaskUpdated = (payload) => {
      if (payload.projectId !== projectId) return
      loadTasks()
      if (payload.action === 'update') toast.success('Sync: Tasks updated', { id: 'sync' })
    }

    socket.on('task_updated', onTaskUpdated)
    return () => {
      isMounted = false
      socket.emit('leave_project', { projectId })
      socket.off('task_updated', onTaskUpdated)
    }
  }, [projectId, workspaceId])

  useEffect(() => {
    if (projectId && project && !projectError) {
      loadTasks()
    }
  }, [projectId, project, filters])

  if (!project && !projectError) {
    return (
      <div className="flex-1 flex flex-col bg-page">
        <div className="h-16 border-b border-white/5 bg-slate-900/20 animate-pulse" />
        <div className="app-container py-10 space-y-8">
          <div className="flex gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 animate-pulse" />
            <div className="space-y-3">
              <div className="h-6 w-48 bg-slate-800 rounded animate-pulse" />
              <div className="h-4 w-72 bg-slate-800 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-page font-['Outfit']">
      {/* Project Header */}
      <header className="flex-shrink-0 border-b border-white/5 bg-slate-900/40 backdrop-blur-md sticky top-0 z-20">
        <div className="app-container py-4 md:py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-6 md:mb-8">
            <div className="flex items-center gap-3 md:gap-5 min-w-0">
              <button 
                onClick={() => navigate(`/workspaces/${workspaceId}`)}
                className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-all border border-white/5 shrink-0"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-slate-800/80 flex items-center justify-center text-xl md:text-3xl shadow-inner border border-white/5 shrink-0">
                {project.icon || '🚀'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                  <h1 className="text-lg md:text-2xl font-black text-white tracking-tight truncate">{project.name}</h1>
                  <span className="badge bg-primary-500/10 border-primary-500/20 text-primary-400 text-[9px] md:text-[10px] font-bold uppercase tracking-widest px-1.5 md:px-2">
                    {project.status}
                  </span>
                </div>
                {project.description && (
                  <p className="text-slate-500 text-xs md:text-sm mt-0.5 md:mt-1 font-medium line-clamp-1">{project.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-3">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2 mr-2 md:mr-4">
                  {members.slice(0, 3).map((m) => (
                    <div key={m.id} className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-[9px] md:text-[10px] font-bold text-white uppercase shadow-lg" title={m.full_name}>
                      {m.initials}
                    </div>
                  ))}
                  {members.length > 3 && (
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-[9px] md:text-[10px] font-bold text-slate-500">
                      +{members.length - 3}
                    </div>
                  )}
                </div>
                <button onClick={loadTasks} className="p-2 md:p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-700 text-slate-400 transition-all">
                  <RefreshCw size={18} className={loading ? 'animate-spin text-primary-500' : ''} />
                </button>
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 md:p-2.5 rounded-xl border transition-all ${showFilters ? 'bg-primary-500/10 border-primary-500/30 text-primary-400' : 'bg-slate-800/50 border-white/5 text-slate-400'}`}
                >
                  <Filter size={18} />
                </button>
              </div>
              {!isViewer && (
                <Button onClick={() => setShowCreateModal(true)} icon={Plus} className="shadow-lg shadow-primary-500/20 text-xs md:text-sm px-4 md:px-6">
                  <span className="hidden xs:inline">New Task</span>
                  <span className="xs:hidden">New</span>
                </Button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-white/5 -mb-5">
            {VIEW_TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className={`relative px-6 py-4 text-sm font-bold transition-all flex items-center gap-2.5 whitespace-nowrap ${
                  view === id ? 'text-primary-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon size={16} />
                {label}
                {view === id && (
                  <motion.div 
                    layoutId="activeTab" 
                    className="absolute bottom-0 left-0 right-0 h-1 bg-primary-500 rounded-t-full"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-page relative">
        <div className="app-container py-4 md:py-8">
          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                onAnimationComplete={() => {
                  // Ensure dropdowns are visible after animation
                }}
                className="mb-6 md:mb-8 bg-slate-900/20 p-4 rounded-2xl border border-white/5 backdrop-blur-sm relative z-30"
              >
                <TaskFilters 
                  members={members} 
                  categories={categories} 
                  onClose={() => setShowFilters(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Suspense fallback={
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <Loader2 className="animate-spin text-primary-500" size={32} />
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Preparing your workspace...</p>
                </div>
              }>
                {view === 'list' && (
                  <TaskListView
                    tasks={tasks}
                    project={project}
                    workspace={activeWorkspace}
                    onRefresh={loadTasks}
                    onCreateTask={() => setShowCreateModal(true)}
                  />
                )}
                {view === 'kanban' && (
                  <KanbanBoard
                    tasks={tasks}
                    project={project}
                    workspace={activeWorkspace}
                    onRefresh={loadTasks}
                    onCreateTask={() => setShowCreateModal(true)}
                  />
                )}
                {view === 'calendar' && (
                  <CalendarView
                    tasks={tasks}
                    project={project}
                    workspace={activeWorkspace}
                    onRefresh={loadTasks}
                    onCreateTask={() => setShowCreateModal(true)}
                  />
                )}
                {view === 'timeline' && (
                  <TimelineView
                    tasks={tasks}
                    project={project}
                    workspace={activeWorkspace}
                    onRefresh={loadTasks}
                    onCreateTask={() => setShowCreateModal(true)}
                  />
                )}
                {view === 'members' && (
                  <ProjectMembersView 
                    projectId={projectId}
                    workspaceId={workspaceId}
                  />
                )}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {showCreateModal && activeWorkspace && (
        <TaskModal
          project={project}
          workspace={activeWorkspace}
          onClose={() => {
            setShowCreateModal(false)
            loadTasks()
          }}
        />
      )}
    </div>
  )
}
