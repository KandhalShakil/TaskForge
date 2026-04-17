import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Pusher from 'pusher-js'
import toast from 'react-hot-toast'
import { chatAPI } from '../../api/chat'
import { useAuthStore } from '../../store/authStore'
import { useChatStore } from '../../store/chatStore'
import { buildTaskRoom, getPusherConfig } from '../../utils/chat'
import ChatSidebar from '../../components/chat/ChatSidebar'
import ChatWindow from '../../components/chat/ChatWindow'

const normalizeMessages = (messages = []) => [...messages].reverse()
const createTempId = () => `client_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

export default function ChatPage() {
  const navigate = useNavigate()
  const { workspaceId, projectId, taskId, directUserId } = useParams()
  const { user } = useAuthStore()
  const {
    threads,
    messages,
    typingUsers,
    activeRoom,
    activeContext,
    setThreads,
    setMessages,
    getRoomMessages,
    setRoomMessages,
    prependMessages,
    appendMessage,
    upsertMessage,
    markMessageStatus,
    clearUnread,
    setActiveRoom,
    setActiveContext,
  } = useChatStore()

  const [workspace, setWorkspace] = useState(null)
  const [members, setMembers] = useState([])
  const [realtimeStatus, setRealtimeStatus] = useState('offline')
  const [loadingContext, setLoadingContext] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState(null)
  const [editingMessage, setEditingMessage] = useState(null)

  const routeContext = useMemo(() => {
    if (taskId) {
      return { workspace_id: workspaceId, task_id: taskId }
    }
    if (directUserId) {
      return { workspace_id: workspaceId, direct_user_id: directUserId }
    }
    return { workspace_id: workspaceId }
  }, [workspaceId, taskId, directUserId])

  const currentTitle = useMemo(() => {
    if (activeContext?.title) return activeContext.title
    if (taskId) return 'Task chat'
    if (directUserId) return 'Direct message'
    return workspace?.name || 'Workspace chat'
  }, [activeContext?.title, taskId, directUserId, workspace?.name])

  const currentSubtitle = useMemo(() => {
    if (activeContext?.subtitle) return activeContext.subtitle
    if (taskId) return 'Discussion for this task'
    if (directUserId) return 'Direct conversation'
    return 'Workspace discussion'
  }, [activeContext?.subtitle, taskId, directUserId])

  useEffect(() => {
    let cancelled = false

    const loadContext = async () => {
      setLoadingContext(true)
      setLoadingMessages(true)

      try {
        const [{ data: contextData }, { data: threadData }] = await Promise.all([
          chatAPI.getContext(routeContext),
          chatAPI.listThreads(routeContext),
        ])

        if (cancelled) return

        setActiveContext(contextData)
        setActiveRoom(contextData.roomId)
        setThreads(threadData.threads || [])
        setMembers(threadData.members || [])
        setWorkspace(threadData.workspace || null)
        clearUnread(contextData.roomId)

        const cachedMessages = getRoomMessages(contextData.roomId)
        if (cachedMessages.length > 0) {
          setMessages(cachedMessages)
          setHasMore(false)
          setNextCursor(null)
          setLoadingMessages(false)
          return
        }

        const { data: messageData } = await chatAPI.listMessages({
          room: contextData.roomId,
          workspace_id: contextData.workspaceId || workspaceId,
          limit: 20,
        })

        if (cancelled) return

        const normalizedMessages = normalizeMessages(messageData.messages || [])
        setRoomMessages(contextData.roomId, normalizedMessages)
        setMessages(normalizedMessages)
        setHasMore(Boolean(messageData.hasMore))
        setNextCursor(messageData.nextCursor || null)
      } catch (error) {
        if (!cancelled) {
          toast.error('Unable to load chat room')
          navigate('/workspaces')
        }
      } finally {
        if (!cancelled) {
          setLoadingContext(false)
          setLoadingMessages(false)
        }
      }
    }

    if (workspaceId && user) {
      loadContext()
    }

    return () => {
      cancelled = true
      setEditingMessage(null)
    }
  }, [workspaceId, taskId, directUserId, user?.id, routeContext, getRoomMessages, setRoomMessages, navigate, clearUnread, setActiveContext, setActiveRoom, setThreads, setMessages])

  useEffect(() => {
    if (!activeContext?.roomId) {
      setRealtimeStatus('offline')
      return undefined
    }

    const { key, cluster } = getPusherConfig()
    if (!key || !cluster) {
      setRealtimeStatus('offline')
      return undefined
    }

    const pusher = new Pusher(key, {
      cluster,
      forceTLS: true,
    })

    const channel = pusher.subscribe('chat-channel')

    const applyMessage = (payload, updater) => {
      const message = payload?.message
      if (!message || message.roomId !== activeContext.roomId) return
      updater({ ...message, status: 'sent' })
    }

    const onNewMessage = (payload) => {
      applyMessage(payload, appendMessage)
      clearUnread(payload?.roomId || activeContext.roomId)
    }

    const onMessageEdited = (payload) => applyMessage(payload, upsertMessage)
    const onMessageDeleted = (payload) => applyMessage(payload, upsertMessage)

    channel.bind('new-message', onNewMessage)
    channel.bind('message-edited', onMessageEdited)
    channel.bind('message-deleted', onMessageDeleted)

    const onStateChange = (states) => {
      if (states.current === 'connected') {
        setRealtimeStatus('open')
      } else if (states.current === 'connecting') {
        setRealtimeStatus('connecting')
      } else {
        setRealtimeStatus('offline')
      }
    }

    pusher.connection.bind('state_change', onStateChange)

    return () => {
      channel.unbind('new-message', onNewMessage)
      channel.unbind('message-edited', onMessageEdited)
      channel.unbind('message-deleted', onMessageDeleted)
      pusher.connection.unbind('state_change', onStateChange)
      pusher.unsubscribe('chat-channel')
      pusher.disconnect()
    }
  }, [activeContext?.roomId, appendMessage, upsertMessage, clearUnread])

  const handleLoadMore = async () => {
    if (!nextCursor || !activeContext?.roomId) return

    const { data } = await chatAPI.listMessages({
      room: activeContext.roomId,
      workspace_id: activeContext.workspaceId || workspaceId,
      limit: 20,
      before: nextCursor,
    })

    const loadedMessages = normalizeMessages(data.messages || [])
    prependMessages(loadedMessages)
    setHasMore(Boolean(data.hasMore))
    setNextCursor(data.nextCursor || null)
  }

  const sendChatMessage = ({ message, attachment, clientMessageId, retryId }) => {
    const optimisticId = clientMessageId || retryId || createTempId()
    const optimisticMessage = {
      id: optimisticId,
      clientMessageId: optimisticId,
      roomId: activeContext.roomId,
      chatType: activeContext.chatType,
      workspaceId: activeContext.workspaceId || workspaceId,
      taskId: activeContext.taskId || null,
      receiverId: activeContext.receiverId || null,
      senderId: String(user?.id),
      sender: user
        ? {
            id: String(user.id),
            full_name: user.full_name || user.name || user.email || 'You',
            email: user.email,
            avatar: user.avatar || null,
            initials: user.initials || 'U',
          }
        : null,
      message,
      attachmentUrl: attachment?.url || null,
      attachmentName: attachment?.name || null,
      attachmentType: attachment?.type || null,
      attachmentSize: attachment?.size || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      readBy: [String(user?.id)],
      isEdited: false,
      isDeleted: false,
      status: 'sending',
    }

    if (retryId) {
      markMessageStatus(retryId, 'sending')
    } else {
      appendMessage(optimisticMessage)
    }

    clearUnread(activeContext.roomId)

    chatAPI.sendMessage({
      room: activeContext.roomId,
      workspace_id: activeContext.workspaceId || workspaceId,
      message,
      attachment,
      clientMessageId: optimisticId,
    })
      .then(({ data }) => {
        if (data) {
          upsertMessage({ ...data, status: 'sent' })
        } else {
          markMessageStatus(optimisticId, 'sent')
        }
      })
      .catch((error) => {
        markMessageStatus(optimisticId, 'failed')
        toast.error(error?.response?.data?.detail || 'Unable to send message')
      })
  }

  const handleSend = ({ message, attachment, editingMessage: currentEditing }) => {
    if (!activeContext?.roomId) {
      throw new Error('No active chat room selected.')
    }

    if (currentEditing?.id) {
      chatAPI.editMessage(currentEditing.id, { message, attachment })
        .then(({ data }) => {
          if (data) {
            upsertMessage({ ...data, status: 'sent' })
          }
        })
        .catch((error) => {
          toast.error(error?.response?.data?.detail || 'Unable to update message')
        })
      setEditingMessage(null)
      return
    }
    sendChatMessage({ message, attachment })
  }

  const handleRetry = (message) => {
    if (!message?.message && !message?.attachmentUrl) return
    sendChatMessage({
      message: message.message || '',
      attachment: message.attachmentUrl
        ? {
            url: message.attachmentUrl,
            name: message.attachmentName,
            type: message.attachmentType,
            size: message.attachmentSize,
          }
        : null,
      retryId: message.clientMessageId || message.id,
    })
  }

  const handleTyping = () => {}

  const handleEdit = (message) => {
    setEditingMessage(message)
  }

  const handleDelete = (message) => {
    if (!message?.id) return
    chatAPI.deleteMessage(message.id).catch((error) => {
      toast.error(error?.response?.data?.detail || 'Unable to delete message')
    })
  }

  const handleAttachment = async (file) => {
    const { data } = await chatAPI.uploadAttachment(file)
    return data
  }

  const handleSelectThread = (thread) => {
    if (!thread) return
    if (thread.chatType === 'workspace') {
      navigate(`/workspaces/${workspaceId}/chat`)
      return
    }
    if (thread.chatType === 'task') {
      navigate(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${thread.taskId || taskId}/chat`)
      return
    }
    if (thread.chatType === 'direct') {
      navigate(`/workspaces/${workspaceId}/chat/dm/${thread.receiverId}`)
    }
  }

  const handleStartDirectMessage = (member) => {
    navigate(`/workspaces/${workspaceId}/chat/dm/${member.id}`)
  }

  if (loadingContext) {
    return (
      <div className="flex h-full items-center justify-center bg-surface-950 text-slate-400">
        Loading chat...
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-surface-950">
      <ChatSidebar
        workspace={workspace}
        threads={threads}
        members={members}
        activeRoom={activeRoom}
        activeTaskRoom={taskId ? buildTaskRoom(taskId) : null}
        onSelectThread={handleSelectThread}
        onStartDirectMessage={handleStartDirectMessage}
      />

      <ChatWindow
        workspace={workspace}
        title={currentTitle}
        subtitle={currentSubtitle}
        messages={messages}
        currentUserId={user?.id}
        onSend={handleSend}
        onLoadMore={handleLoadMore}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRetry={handleRetry}
        onTyping={handleTyping}
        onAttachment={handleAttachment}
        hasMore={hasMore}
        loadingMessages={loadingMessages}
        realtimeStatus={realtimeStatus}
        activeRoom={activeRoom}
        typingUsers={typingUsers}
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
        onClearEditing={() => setEditingMessage(null)}
        onBack={() => navigate(-1)}
        members={members}
        onStartDirectMessage={handleStartDirectMessage}
      />
    </div>
  )
}
