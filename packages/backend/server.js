import { config } from 'dotenv'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import {
  getAllEntities,
  createEntity,
  updateEntity,
  deleteEntity,
} from './controllers/entityController.js'
import { sendDiscordMessage } from './controllers/discordController.js'
import { setupEngagementHandlers, setupOpposedSkillCheckHandlers } from './controllers/sessionController.js'
import { getEntityNames } from './utils/fileService.js'
import { verifyToken, requireAuth, requireAdmin, requireApproved } from './middleware/auth.js'
import { socketAuthMiddleware, socketRequireApproved } from './middleware/socketAuth.js'
import {
  syncUserProfile,
  getCurrentUserProfile,
  updateCurrentUserProfile,
  getAllUsers,
  updateUser,
  deleteUser,
} from './controllers/userController.js'
import { getAuth } from './config/firebase.js'

// Load environment variables
config({ path: new URL('../../.env', import.meta.url) })

// Initialize Firebase Admin
const auth = getAuth()
if (!auth) {
  console.error('Failed to initialize Firebase Admin')
}

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*', // TODO: Restrict this to frontend domain in production
    methods: ['GET', 'POST']
  }
})

// Apply authentication middleware to all socket connections
io.use(socketAuthMiddleware)
io.use(socketRequireApproved)
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(cors())

app.use((req, res, next) => {
  // Protected routes that require authentication
  const protectedRoutes = [
    '/auth',
    '/users'
  ]
  
  if (protectedRoutes.some(route => req.path.startsWith(route))) {
    return verifyToken(req, res, next)
  }
  
  // All other routes are public
  next()
})

// Auth routes
app.post('/auth/sync-profile', requireAuth, syncUserProfile)

// User profile routes
app.get('/users/profile', requireAuth, getCurrentUserProfile)
app.put('/users/profile', requireAuth, updateCurrentUserProfile)

// Admin user management routes
app.get('/users/admin/all', requireAuth, requireAdmin, getAllUsers)
app.put('/users/admin/:userId', requireAuth, requireAdmin, updateUser)
app.delete('/users/admin/:userId', requireAuth, requireAdmin, deleteUser)

// Dynamically retrieve entity names from the "data" directory
const entities = getEntityNames()

// Dynamically create routes for each entity
entities.forEach((entity) => {
  // All entities are public for reading, admin-only for writing
  app.get(`/${entity}`, getAllEntities(entity))
  app.post(`/${entity}`, verifyToken, requireAuth, requireAdmin, createEntity(entity))
  app.put(`/${entity}/:id`, verifyToken, requireAuth, requireAdmin, updateEntity(entity))
  app.delete(`/${entity}/:id`, verifyToken, requireAuth, requireAdmin, deleteEntity(entity))
})

// Discord route
app.post('/send-discord-message', sendDiscordMessage)

// Set up Socket.io handlers
setupEngagementHandlers(io)
setupOpposedSkillCheckHandlers(io)

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
  console.log(`Socket.IO is ready for WebSocket connections`)
})
