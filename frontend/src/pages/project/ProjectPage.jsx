import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, List, Columns, Calendar, GanttChart, Loader2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { useProjectStore } from '../../store/projectStore'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useTaskStore } from '../../store/taskStore'
import TaskListView from '../../components/tasks/TaskListView'
import TaskModal from '../../components/tasks/TaskModal'
import TaskFilters from '../../components/tasks/TaskFilters'
import Skeleton from '../../components/common/Skeleton'
import { useAuthStore } from '../../store/authStore'

const KanbanBoard = lazy(() => import('../../components/kanban/KanbanBoard'))
const CalendarView = lazy(() => import('../../components/calendar/CalendarView'))
const TimelineView = lazy(() => import('../../components/timeline/TimelineView'))

const VIEW_TABS = [
  { id: 'list', label: 'List', Icon: List },
  { id: 'kanban', label: 'Board', Icon: Columns },
  { id: 'calendar', label: 'Calendar', Icon: Calendar },
  { id: 'timeline', label: 'Timeline', Icon: GanttChart },
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
  const notFoundHandledRef = useRef(false)

  const loadTasks = () => {
    fetchTasks({ project: projectId })
  }

  useEffect(() => {
    let isMounted = true

    if (!projectId || notFoundHandledRef.current) {
      return () => {
        isMounted = false
      }
    }

    fetchProjectById(projectId)
      .then((projectData) => {
        if (!isMounted) return
        setProject(projectData)
        setActiveProject(projectData)
        setProjectError(false)
        notFoundHandledRef.current = false
      })
      .catch((error) => {
        if (!isMounted || notFoundHandledRef.current) return

        if (error?.response?.status === 404) {
          notFoundHandledRef.current = true
          toast.error('Project not found')
          setProjectError(true)
          setProject(null)
          setActiveProject(null)
          navigate(workspaceId ? `/workspaces/${workspaceId}` : '/workspaces', { replace: true })
        } else {
          toast.error('Failed to load project')
          setProjectError(true)
        }
      })

    if (workspaceId) {
      fetchMembers(workspaceId)
      fetchCategories(workspaceId)
    }

    return () => {
      isMounted = false
    }
  }, [projectId, workspaceId, navigate, setActiveProject, fetchProjectById, fetchMembers, fetchCategories])

  useEffect(() => {
    if (projectId && project && !projectError) {
      loadTasks()
    }
  }, [projectId, project, projectError, filters])

  if (projectError) {
    return null
  }

  if (!project) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b" style={{ borderColor: 'var(--border-main)', backgroundColor: 'var(--bg-card)' }}>
          <div className="app-container py-6 sm:py-8">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
              <Skeleton variant="rect" width="48px" height="48px" className="rounded-xl" />
              <div className="space-y-2">
                <Skeleton variant="text" width="200px" height="24px" />
                <Skeleton variant="text" width="300px" height="12px" />
              </div>
            </div>
            <Skeleton variant="rect" width="120px" height="40px" className="rounded-xl" />
          </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="rect" width="80px" height="32px" className="rounded-lg" />)}
            </div>
          </div>
        </div>
        <div className="app-container py-4 sm:py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card p-5 space-y-4">
              <Skeleton variant="text" width="80%" height="20px" />
              <Skeleton variant="text" width="100%" height="40px" />
              <div className="flex justify-between">
                <Skeleton variant="rect" width="60px" height="20px" />
                <Skeleton variant="circle" width="24px" height="24px" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="flex-shrink-0 border-b" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-main)' }}>
        <div className="app-container py-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
            <div
              className="h-9 w-9 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
              style={{ backgroundColor: project.color + '30' }}
            >
              {project.icon}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base sm:text-lg font-bold" style={{ color: 'var(--text-main)' }}>{project.name}</h1>
              {project.description && (
                <p className="mt-0.5 truncate text-xs" style={{ color: 'var(--text-muted)' }}>{project.description}</p>
              )}
            </div>
          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            <button onClick={loadTasks} className="btn-ghost p-2" title="Refresh">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            {!isViewer && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary flex-1 sm:flex-none"
                id="create-task-btn"
              >
                <Plus size={14} /> New Task
              </button>
            )}
          </div>
          </div>

          <div className="mb-3 flex items-center gap-1 overflow-x-auto pb-1">
          {VIEW_TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`flex shrink-0 items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                view === id
                  ? 'text-white'
                  : 'hover:bg-opacity-50'
              }`}
              style={{ 
                backgroundColor: view === id ? 'var(--primary-main)' : 'transparent',
                color: view === id ? 'white' : 'var(--text-muted)'
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}

          <div className="ml-auto hidden sm:flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{tasks.length} tasks</span>
          </div>
          </div>

          <TaskFilters members={members} categories={categories} />
        </div>
      </div>

      <div className="app-container flex-1 py-4 sm:py-6">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="animate-spin text-primary-500" size={24} />
          </div>
        ) : (
          <Suspense fallback={<div className="flex h-40 items-center justify-center text-slate-400">Loading view...</div>}>
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
          </Suspense>
        )}
      </div>

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
