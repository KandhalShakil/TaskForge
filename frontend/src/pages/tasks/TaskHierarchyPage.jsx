import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, FolderTree, MessageSquare, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useProjectStore } from '../../store/projectStore'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { tasksAPI } from '../../api/tasks'
import { workspacesAPI } from '../../api/workspaces'
import TaskListView from '../../components/tasks/TaskListView'

export default function TaskHierarchyPage() {
  const navigate = useNavigate()
  const { workspaceId, projectId, taskId } = useParams()
  const { getProjectById, fetchProjectById, setActiveProject } = useProjectStore()
  const { workspaces } = useWorkspaceStore()

  const [workspace, setWorkspace] = useState(null)
  const [project, setProject] = useState(null)
  const [node, setNode] = useState(null)
  const [nodeType, setNodeType] = useState('task')
  const [rootTask, setRootTask] = useState(null)
  const [children, setChildren] = useState([])
  const [breadcrumb, setBreadcrumb] = useState([])
  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')


  // Prevent repeated redirects
  const [hasRedirected, setHasRedirected] = useState(false)

  useEffect(() => {
    if (!hasRedirected) {
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, projectId, taskId])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError('')

      if (!workspaceId || !projectId || !taskId) {
        setError('Missing route context.')
        return
      }

      const ws = workspaces.find((item) => item.id === workspaceId)
      if (!ws) {
        setError('Workspace not found')
        toast.error('Workspace not found')
        return
      }
      setWorkspace(ws)

      let proj = getProjectById(projectId)
      if (!proj) {
        proj = await fetchProjectById(projectId)
      }
      setProject(proj)
      setActiveProject(proj)

      const { data: membersData } = await workspacesAPI.listMembers(workspaceId)
      setMembers(membersData?.results || membersData || [])

      let resolvedNode = null
      let resolvedType = 'task'
      let resolvedRootTask = null


      try {
        try {
          const { data } = await tasksAPI.getTask(taskId)
          resolvedNode = data
          resolvedType = 'task'
          resolvedRootTask = data
        } catch (taskErr) {
          // Task not found, try subtask
          if (taskErr.response?.status === 404) {
            try {
              const { data } = await tasksAPI.getSubtask(taskId)
              resolvedNode = data
              resolvedType = 'subtask'
              const { data: taskData } = await tasksAPI.getTask(data.task)
              resolvedRootTask = taskData
            } catch (subtaskErr) {
              // Both task and subtask not found, redirect to project
              if (subtaskErr.response?.status === 404) {
                setError('Task not found. Redirecting to project...')
                setHasRedirected(true)
                setTimeout(() => {
                  navigate(`/workspaces/${workspaceId}/projects/${projectId}`)
                }, 1200)
                return
              }
              throw subtaskErr
            }
          } else {
            throw taskErr
          }
        }
      } catch (err) {
        console.error('Error loading task:', err)
        setError('Failed to load task.')
        setHasRedirected(true)
        return
      }

      setNode(resolvedNode)
      setNodeType(resolvedType)
      setRootTask(resolvedRootTask)

      const { data: childData } = await tasksAPI.listSubtasks(taskId)
      const directChildren = childData?.results || childData || []
      setChildren(directChildren)

      const trail = [{ id: projectId, title: proj?.name || 'Project', to: `/workspaces/${workspaceId}/projects/${projectId}` }]
      if (resolvedRootTask) {
        trail.push({ id: resolvedRootTask.id, title: resolvedRootTask.title, to: `/workspaces/${workspaceId}/projects/${projectId}/tasks/${resolvedRootTask.id}` })
      }

      if (resolvedType === 'subtask') {
        const ancestors = []
        let cursor = resolvedNode
        while (cursor) {
          ancestors.unshift({ id: cursor.id, title: cursor.title, to: `/workspaces/${workspaceId}/projects/${projectId}/tasks/${cursor.id}` })
          if (!cursor.parent) {
            break
          }
          try {
            const { data: parentData } = await tasksAPI.getSubtask(cursor.parent)
            cursor = parentData
          } catch (parentErr) {
            if (parentErr.response?.status === 404) {
              break
            }
            throw parentErr
          }
        }
        trail.push(...ancestors)
      }

      setBreadcrumb(trail)
    } catch (err) {
      console.error(err)
      setError('Failed to load task dashboard.')
      toast.error('Failed to load task dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const assigneeName = useMemo(() => {
    if (!node?.assignee?.id) return 'Unassigned'
    return node.assignee.full_name || 'Unassigned'
  }, [node])

  const handleOpenChild = (child) => `/workspaces/${workspaceId}/projects/${projectId}/tasks/${child.id}`

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="text-slate-400">Loading dashboard...</div>
      </div>
    )
  }

  if (error || !node || !project || !workspace) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center p-6">
        <div className="text-center space-y-3 max-w-md">
          <div className="text-slate-200">{error || 'Task not found'}</div>
          {!hasRedirected && (
            <button
              onClick={() => {
                setHasRedirected(true)
                navigate(`/workspaces/${workspaceId}/projects/${projectId}`)
              }}
              className="text-sm text-primary-300 hover:text-primary-200"
            >
              Go back to project dashboard
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-950">
      <div className="sticky top-0 z-10 bg-surface-900/85 backdrop-blur border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-surface-800 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-slate-400" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              {breadcrumb.map((item, index) => (
                <div key={`${item.id}-${index}`} className="flex items-center gap-2 min-w-0">
                  {index > 0 && <ChevronRight size={12} className="text-slate-600" />}
                  {item.to ? (
                    <Link to={item.to} className="truncate hover:text-slate-200 transition-colors">
                      {item.title}
                    </Link>
                  ) : (
                    <span className="truncate text-slate-200">{item.title}</span>
                  )}
                </div>
              ))}
            </div>
            <h1 className="text-xl font-semibold text-white truncate mt-1">{node.title}</h1>
          </div>
          <button
            onClick={() => navigate(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${node.id}/create-subtask`)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus size={14} /> Add Subtask
          </button>
          <button
            onClick={() => navigate(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/chat`)}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <MessageSquare size={14} /> Chat
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
          <div className="bg-surface-900/50 rounded-xl border border-slate-800 p-6 space-y-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wide">
              <FolderTree size={14} />
              <span>{nodeType === 'task' ? 'Task Dashboard' : 'Subtask Dashboard'}</span>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Priority</p>
              <p className="text-sm text-white">{node.priority || 'No priority'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Status</p>
              <p className="text-sm text-white">{node.status || 'todo'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Assignee</p>
              <p className="text-sm text-white">{assigneeName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Due Date</p>
              <p className="text-sm text-white">{node.due_date || 'Not set'}</p>
            </div>
            {node.description && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Description</p>
                <p className="text-sm text-slate-300 whitespace-pre-wrap leading-6">{node.description}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Direct Children</h2>
                <p className="text-xs text-slate-500">Only immediate children for this node are shown.</p>
              </div>
            </div>

            <TaskListView
              tasks={children}
              project={project}
              workspace={workspace}
              members={members}
              onRefresh={loadData}
              onCreateTask={() => navigate(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${node.id}/create-subtask`)}
              getTaskPath={handleOpenChild}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
