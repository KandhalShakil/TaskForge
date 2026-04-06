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

const VIEW_TABS = [
  { id: 'list', label: 'List', Icon: List },
  { id: 'kanban', label: 'Board', Icon: Columns },
  { id: 'calendar', label: 'Calendar', Icon: Calendar },
  { id: 'timeline', label: 'Timeline', Icon: GanttChart },
]

export default function ProjectPage() {
  const { workspaceId, projectId } = useParams()
  const { activeWorkspace, members, fetchMembers } = useWorkspaceStore()
  const { setActiveProject } = useProjectStore()
  const { tasks, categories, loading, fetchTasks, fetchCategories, filters } = useTaskStore()

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
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-primary-500" size={32} />
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
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
              id="create-task-btn"
            >
              <Plus size={14} /> New Task
            </button>
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
              />
            )}
            {view === 'kanban' && (
              <KanbanBoard
                tasks={tasks}
                project={project}
                workspace={activeWorkspace}
                onRefresh={loadTasks}
              />
            )}
            {view === 'calendar' && (
              <CalendarView
                tasks={tasks}
                project={project}
                workspace={activeWorkspace}
                onRefresh={loadTasks}
              />
            )}
            {view === 'timeline' && (
              <TimelineView
                tasks={tasks}
                project={project}
                workspace={activeWorkspace}
                onRefresh={loadTasks}
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
