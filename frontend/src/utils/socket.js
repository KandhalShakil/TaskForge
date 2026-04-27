import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'

// Singleton socket instance — shared across the entire app
let socket = null

/**
 * Get (or lazily create) the socket instance.
 * The socket connects once and stays connected for the app's lifetime.
 */
export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    })



    socket.on('connect_error', (err) => {
      console.warn('[Socket.IO] Connection error:', err.message)
    })
  }
  return socket
}

/**
 * Connect the socket (idempotent — safe to call multiple times).
 */
export function connectSocket() {
  const s = getSocket()
  if (!s.connected) s.connect()
  return s
}

/**
 * Join a chat room so this socket receives messages for it.
 * @param {string} chatId  - e.g. "workspace_abc", "task_xyz", "dm_1_2"
 * @param {string} userId
 */
export function joinRoom(chatId, userId) {
  const s = getSocket()
  if (s.connected) {
    s.emit('join', { chatId, userId })
  } else {
    // Queue join after connect
    s.once('connect', () => s.emit('join', { chatId, userId }))
    s.connect()
  }
}

/**
 * Leave a chat room.
 * @param {string} chatId
 */
export function leaveRoom(chatId) {
  const s = getSocket()
  if (s.connected) {
    s.emit('leave', { chatId })
  }
}

/**
 * Broadcast a saved message to all other room members.
 * Call this AFTER the Django API responds with the saved message.
 * @param {object} message - The saved message object returned by the API
 */
export function emitMessage(message) {
  const s = getSocket()
  if (s.connected) {
    s.emit('send_message', message)
  }
}
