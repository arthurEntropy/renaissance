require('dotenv').config()
const express = require('express')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')
const {
  getAllEntities,
  createEntity,
  updateEntity,
  deleteEntity,
} = require('./controllers/entityController.js')
const { sendDiscordMessage } = require('./controllers/discordController.js')
const { setupSocketHandlers } = require('./controllers/engagementController.js')
const { getEntityNames } = require('./utils/fileService.js')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*', // Restrict this to frontend domain in production
    methods: ['GET', 'POST']
  }
})
const PORT = 3000

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
  console.log(`Server is running on http://localhost:${PORT}`)
  console.log(`Socket.IO is ready for WebSocket connections`)
})
