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
import {
  scanCleanup,
  deleteCleanupItems,
} from './controllers/adminCleanupController.js'
import { sendDiscordMessage } from './controllers/discordController.js'
import { setupEngagementHandlers, setupOpposedSkillCheckHandlers } from './controllers/sessionController.js'
import { getEntityNames } from './utils/fileService.js'
import { verifyToken, requireAuth, requireAdmin, requireApproved } from './middleware/auth.js'
import { socketAuthMiddleware, socketRequireApproved } from './middleware/socketAuth.js'
import {
  syncUserProfile,
  getCurrentUserProfile,
  getPublicUsersByIds,
  searchUsers,
  updateCurrentUserProfile,
  getAllUsers,
  updateUser,
  deleteUser,
} from './controllers/userController.js'
import {
  getUserCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  inviteMember,
  respondToInvite,
  updateMemberRole,
  removeMember,
  updateIncludedConcepts,
  getCampaignCharacters,
  createCampaignCharacter,
  updateMemberCharacters,
  generateShop,
  saveShop,
  updateShop,
  deleteShop,
  getPendingInvites,
  getCampaignBySlug,
  deleteBeastInstance,
  updateLobbyState,
} from './controllers/campaignController.js'
import {
  requireCampaignMember,
  requireCampaignGM,
  requireCampaignFoundingGM,
} from './middleware/campaignAuth.js'
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
    '/users',
    '/campaigns',
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
app.get('/users/public', requireAuth, requireApproved, getPublicUsersByIds)
app.get('/users/search', requireAuth, requireApproved, searchUsers)
app.put('/users/profile', requireAuth, updateCurrentUserProfile)

// Admin user management routes
app.get('/users/admin/all', requireAuth, requireAdmin, getAllUsers)
app.put('/users/admin/:userId', requireAuth, requireAdmin, updateUser)
app.delete('/users/admin/:userId', requireAuth, requireAdmin, deleteUser)

// Admin cleanup routes
app.get('/admin/cleanup/scan', verifyToken, requireAuth, requireAdmin, scanCleanup)
app.post('/admin/cleanup/delete', verifyToken, requireAuth, requireAdmin, deleteCleanupItems)

// Campaign routes (all require auth + approval)
app.get('/campaigns/invites/pending', requireAuth, requireApproved, getPendingInvites)
app.get('/campaigns/by-slug/:slug', requireAuth, requireApproved, getCampaignBySlug)
app.get('/campaigns', requireAuth, requireApproved, getUserCampaigns)
app.post('/campaigns', requireAuth, requireApproved, createCampaign)
app.get('/campaigns/:id', requireAuth, requireCampaignMember, getCampaign)
app.put('/campaigns/:id', requireAuth, requireCampaignGM, updateCampaign)
app.delete('/campaigns/:id', requireAuth, requireCampaignFoundingGM, deleteCampaign)

// Campaign member management
app.post('/campaigns/:id/invite', requireAuth, requireCampaignGM, inviteMember)
app.put('/campaigns/:id/members/:userId/respond', requireAuth, requireApproved, respondToInvite)
app.put('/campaigns/:id/members/:userId/role', requireAuth, requireCampaignGM, updateMemberRole)
app.delete('/campaigns/:id/members/:userId', requireAuth, requireCampaignGM, removeMember)
app.put('/campaigns/:id/members/:userId/characters', requireAuth, requireApproved, updateMemberCharacters)

// Campaign concepts
app.put('/campaigns/:id/concepts', requireAuth, requireCampaignGM, updateIncludedConcepts)

// Campaign characters (NPCs + beast instances)
app.get('/campaigns/:id/characters', requireAuth, requireCampaignMember, getCampaignCharacters)
app.post('/campaigns/:id/characters', requireAuth, requireCampaignGM, createCampaignCharacter)
app.delete('/campaigns/:id/beasts/:characterId', requireAuth, requireCampaignGM, deleteBeastInstance)

// Campaign lobby state
app.put('/campaigns/:id/lobby-state', requireAuth, requireCampaignGM, updateLobbyState)

// Campaign shops
app.post('/campaigns/:id/shops/generate', requireAuth, requireCampaignGM, generateShop)
app.post('/campaigns/:id/shops', requireAuth, requireCampaignGM, saveShop)
app.put('/campaigns/:id/shops/:shopId', requireAuth, requireCampaignGM, updateShop)
app.delete('/campaigns/:id/shops/:shopId', requireAuth, requireCampaignGM, deleteShop)

// Character-specific routes — allow any approved user to manage their own characters
// (must be defined before the generic entity loop below)
app.get('/characters', getAllEntities('characters'))
app.post('/characters', verifyToken, requireAuth, requireApproved, createEntity('characters'))
app.put('/characters/:id', verifyToken, requireAuth, requireApproved, updateEntity('characters'))
app.delete('/characters/:id', verifyToken, requireAuth, requireApproved, deleteEntity('characters'))

// Dynamically retrieve entity names from the "data" directory
const entities = getEntityNames()

// Dynamically create CRUD routes for each data entity
entities.forEach((entity) => {
  // Characters have their own routes above (non-admin write access)
  // Campaigns have their own routes above
  if (
    entity === 'characters' ||
    entity === 'campaigns' ||
    entity === 'playerCharacters' ||
    entity === 'npcs' ||
    entity === 'beasts' ||
    entity === 'beastInstances'
  ) {
    return
  }

  // All other data entities are public for reading, admin-only for writing
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
