import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, List, Columns, Calendar, GanttChart, Loader2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { useProjectStore } from '../../store/projectStore'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useTaskStore } from '../../store/taskStore'
import { projectsAPI } from '../../api/projects'
import TaskListView from '../../components/tasks/TaskListView'
import KanbanBoard from '../../components/kanban/KanbanBoard'
import CalendarView from '../../components/calendar/CalendarView'
import TimelineView from '../../components/timeline/TimelineView'
import TaskModal from '../../components/tasks/TaskModal'
import TaskFilters from '../../components/tasks/TaskFilters'
import Skeleton from '../../components/common/Skeleton'
import { useAuthStore } from '../../store/authStore'

const VIEW_TABS = [
  { id: 'list', label: 'List', Icon: List },
  { id: 'kanban', label: 'Board', Icon: Columns },
  { id: 'calendar', label: 'Calendar', Icon: Calendar },
  { id: 'timeline', label: 'Timeline', Icon: GanttChart },
]

export default function ProjectPage() {
  const { workspaceId, projectId } = useParams()
  const { activeWorkspace, members, fetchMembers, getUserRole } = useWorkspaceStore()
  const { user } = useAuthStore()
  const { setActiveProject } = useProjectStore()
  const { tasks, categories, loading, fetchTasks, fetchCategories, filters } = useTaskStore()

  const userRole = getUserRole(user?.id)
  const isViewer = userRole === 'viewer'

  const [project, setProject] = useState(null)
  const [view, setView] = useState('list')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    // Load project details
    projectsAPI.get(projectId).then(({ data }) => {
      setProject(data)
      setActiveProject(data)
    })
    if (workspaceId) {
      fetchMembers(workspaceId)
      fetchCategories(workspaceId)
    }
  }, [projectId, workspaceId])

  useEffect(() => {
    if (projectId) {
      loadTasks()
    }
  }, [projectId, filters])

  const loadTasks = () => {
    fetchTasks({ project: projectId })
  }

  if (!project) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-6 py-8 border-b border-slate-800 bg-surface-900/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Skeleton variant="rect" width="48px" height="48px" className="rounded-xl" />
              <div className="space-y-2">
                <Skeleton variant="text" width="200px" height="24px" />
                <Skeleton variant="text" width="300px" height="12px" />
              </div>
            </div>
            <Skeleton variant="rect" width="120px" height="40px" className="rounded-xl" />
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="rect" width="80px" height="32px" className="rounded-lg" />)}
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* Project header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-slate-800 bg-surface-900">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
              style={{ backgroundColor: project.color + '30' }}
            >
              {project.icon}
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">{project.name}</h1>
              {project.description && (
                <p className="text-xs text-slate-500 mt-0.5">{project.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadTasks}
              className="btn-ghost p-2"
              title="Refresh"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            {!isViewer && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
                id="create-task-btn"
              >
                <Plus size={14} /> New Task
              </button>
            )}
          </div>
        </div>

        {/* View tabs */}
        <div className="flex items-center gap-1 mb-3">
          {VIEW_TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                view === id
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-surface-800'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-slate-500">{tasks.length} tasks</span>
          </div>
        </div>

        {/* Filters */}
        <TaskFilters members={members} categories={categories} />
      </div>

      {/* Task view area */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="animate-spin text-primary-500" size={24} />
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>

      {showCreateModal && activeWorkspace && (
        <TaskModal
          project={project}
          workspace={activeWorkspace}
          onClose={() => { setShowCreateModal(false); loadTasks() }}
        />
      )}
    </div>
  )
}
