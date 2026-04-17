import { create } from 'zustand'

const sortThreads = (threads = []) => {
  return [...threads].sort((a, b) => {
    const left = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
    const right = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
    return right - left
  })
}

const applyThreadUpdate = (threads, incoming) => {
  const index = threads.findIndex((thread) => thread.roomId === incoming.roomId)
  if (index === -1) {
    return sortThreads([incoming, ...threads])
  }

  const nextThreads = [...threads]
  nextThreads[index] = {
    ...nextThreads[index],
    ...incoming,
    unreadCount: incoming.unreadCount ?? nextThreads[index].unreadCount,
  }
  return sortThreads(nextThreads)
}

const mergeMessageList = (messages = [], message) => {
  const exists = messages.some((existing) => existing.id === message.id || (message.clientMessageId && existing.clientMessageId === message.clientMessageId))
  if (!exists) {
    return [...messages, message]
  }

  return messages.map((existing) => (
    existing.id === message.id || (message.clientMessageId && existing.clientMessageId === message.clientMessageId)
      ? { ...existing, ...message }
      : existing
  ))
}

export const useChatStore = create((set, get) => ({
  threads: [],
  activeRoom: null,
  messages: [],
  messagesByRoom: {},
  typingUsers: {},
  unreadCounts: {},
  onlineUsers: {},
  activeContext: null,

  setThreads: (threads) => set({ threads: sortThreads(threads) }),

  setActiveContext: (context) => set({ activeContext: context }),

  setActiveRoom: (roomId) => set({ activeRoom: roomId }),

  setMessages: (messages) => set((state) => {
    const activeRoom = state.activeRoom
    return {
      messages,
      messagesByRoom: activeRoom ? { ...state.messagesByRoom, [activeRoom]: messages } : state.messagesByRoom,
    }
  }),

  getRoomMessages: (roomId) => {
    const { messagesByRoom } = get()
    return messagesByRoom[roomId] || []
  },

  setRoomMessages: (roomId, messages) => set((state) => ({
    messagesByRoom: { ...state.messagesByRoom, [roomId]: messages },
    messages: state.activeRoom === roomId ? messages : state.messages,
  })),

  prependMessages: (messages) => set((state) => {
    const roomId = state.activeRoom
    const nextMessages = [...messages, ...state.messages]
    return {
      messages: nextMessages,
      messagesByRoom: roomId ? { ...state.messagesByRoom, [roomId]: nextMessages } : state.messagesByRoom,
    }
  }),

  appendMessage: (message) => set((state) => {
    const roomId = message.roomId || state.activeRoom
    const nextMessages = mergeMessageList(state.messages, message)
    const nextMessagesByRoom = roomId
      ? {
          ...state.messagesByRoom,
          [roomId]: mergeMessageList(state.messagesByRoom[roomId] || [], message),
        }
      : state.messagesByRoom

    return {
      messages: nextMessages,
      messagesByRoom: nextMessagesByRoom,
    }
  }),

  upsertMessage: (message) => set((state) => ({
    messages: mergeMessageList(state.messages, message),
    messagesByRoom: Object.fromEntries(
      Object.entries(state.messagesByRoom).map(([roomId, roomMessages]) => [
        roomId,
        mergeMessageList(roomMessages, message),
      ]),
    ),
  })),

  markMessageStatus: (identifier, status, extra = {}) => set((state) => ({
    messages: state.messages.map((message) => (
      message.id === identifier || message.clientMessageId === identifier
        ? { ...message, status, ...extra }
        : message
    )),
    messagesByRoom: Object.fromEntries(
      Object.entries(state.messagesByRoom).map(([roomId, roomMessages]) => [
        roomId,
        roomMessages.map((message) => (
          message.id === identifier || message.clientMessageId === identifier
            ? { ...message, status, ...extra }
            : message
        )),
      ]),
    ),
  })),

  setTypingUser: (userId, isTyping) => set((state) => {
    const next = { ...state.typingUsers }
    if (isTyping) {
      next[userId] = true
    } else {
      delete next[userId]
    }
    return { typingUsers: next }
  }),

  setOnlineUser: (userId, isOnline) => set((state) => {
    const next = { ...state.onlineUsers }
    if (isOnline) {
      next[userId] = true
    } else {
      delete next[userId]
    }
    return { onlineUsers: next }
  }),

  clearUnread: (roomId) => set((state) => ({
    unreadCounts: { ...state.unreadCounts, [roomId]: 0 },
    threads: state.threads.map((thread) => (thread.roomId === roomId ? { ...thread, unreadCount: 0 } : thread)),
  })),

  incrementUnread: (roomId, threadPreview = null) => set((state) => {
    const current = state.unreadCounts[roomId] || 0
    const unreadCounts = { ...state.unreadCounts, [roomId]: current + 1 }
    const threads = threadPreview
      ? applyThreadUpdate(state.threads, { ...threadPreview, unreadCount: unreadCounts[roomId] })
      : state.threads.map((thread) => (thread.roomId === roomId ? { ...thread, unreadCount: unreadCounts[roomId] } : thread))

    return { unreadCounts, threads }
  }),

  upsertThread: (thread) => set((state) => ({
    threads: applyThreadUpdate(state.threads, thread),
  })),

  resetChat: () => set({
    activeRoom: null,
    messages: [],
    typingUsers: {},
    activeContext: null,
  }),

  getCurrentUnreadCount: () => {
    const { activeRoom, unreadCounts } = get()
    return activeRoom ? unreadCounts[activeRoom] || 0 : 0
  },
}))
