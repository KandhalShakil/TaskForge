import { useState, useEffect, lazy, Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Pusher from 'pusher-js'
import toast from 'react-hot-toast'
import Sidebar from './Sidebar'
import Header from './Header'
import GlobalLoadingBar from '../common/GlobalLoadingBar'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useAuthStore } from '../../store/authStore'
import { useChatStore } from '../../store/chatStore'
import { getPusherConfig } from '../../utils/chat'

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
  }, [])

  useEffect(() => {
    if (!user?.id) return undefined

    const { key, cluster } = getPusherConfig()
    if (!key || !cluster) return undefined

    const pusher = new Pusher(key, {
      cluster,
      forceTLS: true,
    })
    const channel = pusher.subscribe('chat-channel')

    const onNewMessage = (payload) => {
      const message = payload?.message
      if (!message?.roomId) return
      if (payload?.actorId === String(user.id)) return
      if (message.roomId === useChatStore.getState().activeRoom) return

      incrementUnread(message.roomId, {
        roomId: message.roomId,
        chatType: message.chatType,
        workspaceId: message.workspaceId,
        taskId: message.taskId,
        receiverId: message.receiverId,
        title: payload?.title || message.sender?.full_name || 'New message',
        subtitle: payload?.subtitle || 'Chat',
        lastMessage: message.message || message.attachmentName || 'Attachment',
        lastMessageAt: message.createdAt,
      })

      toast.success('New message')
    }

    channel.bind('new-message', onNewMessage)

    return () => {
      channel.unbind('new-message', onNewMessage)
      pusher.unsubscribe('chat-channel')
      pusher.disconnect()
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
        setCommandPaletteOpen(prev => !prev)
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
        <main className="flex-1 overflow-y-auto overflow-x-hidden w-full">
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
