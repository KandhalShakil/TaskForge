import { useState, useEffect, lazy, Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import Sidebar from './Sidebar'
import Header from './Header'
import GlobalLoadingBar from '../common/GlobalLoadingBar'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useAuthStore } from '../../store/authStore'
import { useChatStore } from '../../store/chatStore'
import { connectSocket } from '../../utils/socket'

const CommandPalette = lazy(() => import('../common/CommandPalette'))

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const location = useLocation()
  const { fetchWorkspaces, fetchInvitations } = useWorkspaceStore()
  const { user } = useAuthStore()
  const { incrementUnread } = useChatStore()

  // Prefetch core data on mount
  useEffect(() => {
    fetchWorkspaces()
    fetchInvitations()

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Global Socket.IO listener — handles notifications for messages
  // received while the user is NOT in that particular chat room
  useEffect(() => {
    if (!user?.id) return undefined

    const socket = connectSocket()

    const onReceiveMessage = (message) => {
      if (!message?.roomId) return
      // Skip if the user sent it or if they are currently in that room
      if (message.senderId === String(user.id)) return
      if (message.roomId === useChatStore.getState().activeRoom) return

      incrementUnread(message.roomId, {
        roomId: message.roomId,
        chatType: message.chatType,
        workspaceId: message.workspaceId,
        taskId: message.taskId,
        receiverId: message.receiverId,
        title: message.sender?.full_name || 'New message',
        subtitle: 'Chat',
        lastMessage: message.message || message.attachmentName || 'Attachment',
        lastMessageAt: message.createdAt,
      })

      const senderName = message.sender?.full_name || 'Someone'
      toast.success(`New message from ${senderName}`)

      if ('Notification' in window && Notification.permission === 'granted') {
        const body = message.message || (message.attachmentName ? 'Sent an attachment' : 'New message')
        new Notification(`New message from ${senderName}`, { body })
      }
    }

    socket.on('receive_message', onReceiveMessage)

    return () => {
      socket.off('receive_message', onReceiveMessage)
    }
  }, [user?.id, incrementUnread])

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  // Global Command+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex min-h-screen overflow-hidden bg-surface-950">
      <GlobalLoadingBar />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} onSearchClick={() => setCommandPaletteOpen(true)} />
        <main className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden w-full">
          <Outlet />
        </main>
      </div>

      <Suspense fallback={null}>
        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
        />
      </Suspense>
    </div>
  )
}
