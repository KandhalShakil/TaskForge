require('dotenv').config()
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')

const app = express()
const server = http.createServer(app)

const PORT = process.env.PORT || 3001
const CORS_ORIGIN = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173']

app.use(cors({ origin: CORS_ORIGIN, credentials: true }))

const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

// Track active rooms per socket for cleanup on disconnect
const socketRooms = new Map()

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Connected: ${socket.id}`)

  // Client joins a specific chat room
  // Payload: { chatId: string, userId: string }
  socket.on('join', ({ chatId, userId } = {}) => {
    if (!chatId) return
    socket.join(chatId)

    // Track rooms this socket has joined
    if (!socketRooms.has(socket.id)) socketRooms.set(socket.id, new Set())
    socketRooms.get(socket.id).add(chatId)

  })

  // Client leaves a specific chat room
  // Payload: { chatId: string }
  socket.on('leave', ({ chatId } = {}) => {
    if (!chatId) return
    socket.leave(chatId)
    socketRooms.get(socket.id)?.delete(chatId)
  })

  // Client sends a message — broadcast to everyone else in the room
  // Payload: message object (already saved by Django, includes id, roomId, senderId, etc.)
  socket.on('send_message', (message) => {
    const { roomId } = message || {}
    if (!roomId) return

    const chatId = roomId  // roomId IS the chatId (e.g. "workspace_abc", "dm_1_2")

    // Emit to everyone in the room EXCEPT the sender
    socket.to(chatId).emit('receive_message', message)
  })

  // Join a private room for user-specific notifications (like invitations)
  // Payload: { userId: string }
  socket.on('join_user', ({ userId } = {}) => {
    if (!userId) return
    const userRoom = `user_${userId}`
    socket.join(userRoom)
    
    if (!socketRooms.has(socket.id)) socketRooms.set(socket.id, new Set())
    socketRooms.get(socket.id).add(userRoom)
  })

  // Client sends an invitation notification to another user
  // Payload: { receiverId: string, sender: object, workspace: object }
  socket.on('send_invitation', (payload) => {
    const { receiverId } = payload || {}
    if (!receiverId) return
    
    const userRoom = `user_${receiverId}`
    socket.to(userRoom).emit('new_invitation', payload)
  })

  // Client accepts an invitation — notify the workspace room (so owners see the status update)
  // Payload: { workspaceId: string, member: object }
  socket.on('accept_invitation', (payload) => {
    const { workspaceId } = payload || {}
    if (!workspaceId) return
    
    const workspaceRoom = `workspace_${workspaceId}`
    socket.to(workspaceRoom).emit('member_accepted', payload)
  })

  // ── Project-specific Synchronization ────────────────────────────────
  
  // Join a project-specific room
  socket.on('join_project', (payload) => {
    const { projectId, userId } = payload || {}
    if (!projectId) return
    
    const projectRoom = `project_${projectId}`
    socket.join(projectRoom)
    
    console.log(`[Socket] User ${userId} joined room: ${projectRoom}`)
  })

  // Leave a project room
  socket.on('leave_project', (payload) => {
    const { projectId } = payload || {}
    if (!projectId) return
    
    const projectRoom = `project_${projectId}`
    socket.leave(projectRoom)
  })

  // Employee removed from project
  socket.on('employee_removed', (payload) => {
    const { projectId, userId } = payload || {}
    if (!projectId) return
    
    const projectRoom = `project_${projectId}`
    // Broadcast to everyone in the project room
    io.to(projectRoom).emit('employee_removed', payload)
  })

  // Task created/updated/deleted
  socket.on('task_updated', (payload) => {
    const { projectId, task, action } = payload || {}
    if (!projectId) return
    
    const projectRoom = `project_${projectId}`
    // Broadcast to everyone in the project room
    io.to(projectRoom).emit('task_updated', payload)
  })

  // Handle disconnect — auto-leave all rooms
  socket.on('disconnect', (reason) => {
    socketRooms.delete(socket.id)
  })
})

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    connections: io.engine.clientsCount,
    timestamp: new Date().toISOString(),
  })
})

server.listen(PORT, () => {
  console.log(`[Socket.IO] Server running on port ${PORT}`)
  console.log(`[Socket.IO] Allowed origins: ${CORS_ORIGIN.join(', ')}`)
})
