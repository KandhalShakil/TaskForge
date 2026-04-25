import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Sidebar from './Sidebar'
import Header from './Header'
import GlobalLoadingBar from '../common/GlobalLoadingBar'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useAuthStore } from '../../store/authStore'
import { useChatStore } from '../../store/chatStore'
import { connectSocket } from '../../utils/socket'



// ── Notification permission request ────────────────────────────────────────
async function requestNotificationPermission() {
  if (!('Notification' in window)) return
  if (Notification.permission === 'default') {
    await Notification.requestPermission()
  }
}

// ── Show a browser push notification ──────────────────────────────────────
function showBrowserNotification({ title, body, icon, onClick }) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const notif = new Notification(title, {
    body,
    icon: icon || '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'chat-message',   // replace instead of stack
    renotify: true,
    silent: false,
  })
  if (onClick) notif.onclick = onClick
}

// ── Rich in-app toast for chat messages ────────────────────────────────────
function ChatToast({ sender, message, onClick }) {
  const letter = sender?.full_name?.[0]?.toUpperCase() || sender?.initials || '?'
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full max-w-sm items-center gap-3 rounded-2xl border border-slate-700/60 bg-surface-900 px-4 py-3 text-left shadow-2xl ring-1 ring-white/5 transition-all hover:border-primary-500/30"
    >
      {sender?.avatar ? (
        <img src={sender.avatar} alt={sender.full_name} className="h-10 w-10 flex-shrink-0 rounded-full object-cover" />
      ) : (
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-primary-400 text-sm font-bold text-white">
          {letter}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{sender?.full_name || 'New message'}</p>
        <p className="truncate text-xs text-slate-400">{message || 'Sent an attachment'}</p>
      </div>
      <span className="shrink-0 rounded-lg bg-primary-600/15 px-2 py-1 text-[10px] font-semibold text-primary-400">
        View
      </span>
    </button>
  )
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { fetchWorkspaces, fetchInvitations } = useWorkspaceStore()
  const { user } = useAuthStore()
  const { incrementUnread } = useChatStore()

  // Prefetch core data + request notification permission on mount
  useEffect(() => {
    fetchWorkspaces()
    fetchInvitations()
    requestNotificationPermission()
  }, [])

  // Navigate to a chat room given a message object
  const navigateToRoom = useCallback((message) => {
    if (!message?.roomId) return
    const { chatType, workspaceId, taskId, receiverId } = message

    if (chatType === 'workspace' && workspaceId) {
      navigate(`/workspaces/${workspaceId}/chat`)
    } else if (chatType === 'task' && workspaceId && taskId) {
      navigate(`/workspaces/${workspaceId}/chat`, { state: { taskId } })
    } else if (chatType === 'direct' && workspaceId && receiverId) {
      navigate(`/workspaces/${workspaceId}/chat/dm/${receiverId}`)
    }
  }, [navigate])

  // ── Global Socket.IO receive_message handler ───────────────────────────
  useEffect(() => {
    if (!user?.id) return undefined

    const socket = connectSocket()

    const onReceiveMessage = (message) => {
      if (!message?.roomId) return

      // Skip own messages
      if (String(message.senderId) === String(user.id)) return

      // Skip if user is currently viewing this room
      const activeRoom = useChatStore.getState().activeRoom
      if (message.roomId === activeRoom && document.visibilityState === 'visible') return

      // Update unread badge on thread in sidebar
      incrementUnread(message.roomId, {
        roomId: message.roomId,
        chatType: message.chatType,
        workspaceId: message.workspaceId,
        taskId: message.taskId,
        receiverId: message.receiverId,
        title: message.sender?.full_name || 'Chat',
        subtitle: message.chatType === 'direct' ? 'Direct message' : 'Workspace',
        lastMessage: message.message || message.attachmentName || 'Attachment',
        lastMessageAt: message.createdAt,
      })

      const senderName = message.sender?.full_name || 'Someone'
      const body = message.message || (message.attachmentName ? `📎 ${message.attachmentName}` : 'Sent a message')

      // Browser notification (works even when tab is in background)
      showBrowserNotification({
        title: `💬 ${senderName}`,
        body,
        onClick: () => {
          window.focus()
          navigateToRoom(message)
        },
      })

      // Rich in-app toast with click-to-navigate
      toast.custom(
        (t) => (
          <ChatToast
            sender={message.sender}
            message={body}
            onClick={() => {
              toast.dismiss(t.id)
              navigateToRoom(message)
            }}
          />
        ),
        {
          duration: 5000,
          position: 'bottom-right',
        }
      )
    }

    socket.on('receive_message', onReceiveMessage)
    return () => socket.off('receive_message', onReceiveMessage)
  }, [user?.id, incrementUnread, navigateToRoom])

  // ── Theme management ──────────────────────────────────────────────────────
  useEffect(() => {
    const theme = user?.settings?.appearance?.theme || 'dark'
    const root = window.document.documentElement
    
    const applyTheme = (t) => {
      if (t === 'dark') {
        root.classList.add('dark')
      } else if (t === 'light') {
        root.classList.remove('dark')
      } else if (t === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        root.classList.toggle('dark', isDark)
      }
    }

    applyTheme(theme)

    // Listener for system theme changes if 'system' is selected
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = (e) => root.classList.toggle('dark', e.matches)
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }
    return undefined
  }, [user?.settings?.appearance?.theme])

  // ── Accent Color management ────────────────────────────────────────────────
  useEffect(() => {
    const accent = user?.settings?.appearance?.accentColor || '#06b6d4'
    const root = window.document.documentElement
    
    // Apply primary color
    root.style.setProperty('--primary-main', accent)
    
    // Apply glow effect (15% opacity hex)
    // If accent is #06b6d4, glow is #06b6d426
    root.style.setProperty('--primary-glow', `${accent}26`)
    
  }, [user?.settings?.appearance?.accentColor])
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])



  return (
    <div className="flex flex-1 w-full min-h-0 overflow-hidden" style={{ backgroundColor: 'var(--bg-page)' }}>
      <GlobalLoadingBar />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex flex-1 min-h-0 flex-col overflow-y-auto w-full">
          <Outlet />
        </main>
      </div>


    </div>
  )
}
