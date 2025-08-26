import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
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
import { setupSocketHandlers } from './controllers/engagementController.js'
import { getEntityNames } from './utils/fileService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Configure dotenv with the correct path to the .env file
config({ path: resolve(__dirname, '../../.env') })

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*', // TODO: Restrict this to frontend domain in production
    methods: ['GET', 'POST']
  }
})
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(cors())

// Dynamically retrieve entity names from the "data" directory
const entities = getEntityNames()

// Dynamically create routes for each entity
entities.forEach((entity) => {
  app.get(`/${entity}`, getAllEntities(entity))
  app.post(`/${entity}`, createEntity(entity))
  app.put(`/${entity}/:id`, updateEntity(entity))
  app.delete(`/${entity}/:id`, deleteEntity(entity)) // Currently only soft-deleting across the app, but leaving in place for future.
})

// Discord route
app.post('/send-discord-message', sendDiscordMessage)

// Set up Socket.io handlers
setupSocketHandlers(io)

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
  console.log(`Socket.IO is ready for WebSocket connections`)
})
