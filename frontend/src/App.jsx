import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import AppLayout from './components/layout/AppLayout'

const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'))
const WorkspacePage = lazy(() => import('./pages/workspace/WorkspacePage'))
const ProjectPage = lazy(() => import('./pages/project/ProjectPage'))
const AnalyticsDashboard = lazy(() => import('./pages/dashboard/AnalyticsDashboard'))
const WorkspaceMembersPage = lazy(() => import('./pages/workspace/WorkspaceMembersPage'))
const TaskHierarchyPage = lazy(() => import('./pages/tasks/TaskHierarchyPage'))
const CreateSubtaskPage = lazy(() => import('./pages/tasks/CreateSubtaskPage'))
const SubtaskDetailPage = lazy(() => import('./pages/tasks/SubtaskDetailPage'))
const ChatPage = lazy(() => import('./pages/chat/ChatPage'))
const ProfilePage = lazy(() => import('./pages/auth/ProfilePage'))
const SettingsPage = lazy(() => import('./pages/auth/SettingsPage'))

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <Navigate to="/workspaces" replace /> : children
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155',
          },
          success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
        }}
      />
      <Suspense fallback={<div className="min-h-screen bg-surface-950 flex items-center justify-center text-slate-400">Loading...</div>}>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/workspaces" replace />} />
            <Route path="/workspaces" element={<WorkspacePage />} />
            <Route path="/workspaces/:workspaceId/members" element={<WorkspaceMembersPage />} />
            <Route path="/workspaces/:workspaceId/projects/:projectId" element={<ProjectPage />} />
            <Route path="/workspaces/:workspaceId/projects/:projectId/tasks/:taskId" element={<TaskHierarchyPage />} />
            <Route path="/workspaces/:workspaceId/projects/:projectId/tasks/:taskId/create-subtask" element={<CreateSubtaskPage />} />
            <Route path="/workspaces/:workspaceId/projects/:projectId/tasks/:taskId/subtasks/:subtaskId" element={<SubtaskDetailPage />} />
            <Route path="/workspaces/:workspaceId/chat" element={<ChatPage />} />
            <Route path="/workspaces/:workspaceId/chat/dm/:directUserId" element={<ChatPage />} />
            <Route path="/workspaces/:workspaceId/projects/:projectId/tasks/:taskId/chat" element={<ChatPage />} />
            <Route path="/workspaces/:workspaceId/dashboard" element={<AnalyticsDashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/workspaces" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
