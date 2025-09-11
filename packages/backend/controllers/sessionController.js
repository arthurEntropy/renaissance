import { v4 as uuidv4 } from 'uuid'
import { SESSION_STATUS } from '../../../shared/constants/sessionStatus.js'
import { opposedSkillCheckConfig } from './sessionConfigs/opposedSkillCheckConfig.js'
import { engagementConfig } from './sessionConfigs/engagementConfig.js'

const SESSION_CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 minutes
const SESSION_MAX_AGE = 30 * 60 * 1000 // 30 minutes

function createSessionController(config) {
  const {
    namespace,
    createUserData,
    additionalSocketHandlers = [],
    sessionType = 'session'
  } = config

  const activeSessions = new Map()
  let sessionIO = null
  let availableSessionId = null

  const setupSocketHandlers = (io) => {
    sessionIO = io.of(namespace)
    
    sessionIO.on('connection', (socket) => {
      setupCommonHandlers(socket)
      
      additionalSocketHandlers.forEach(handler => {
        handler(socket, { activeSessions, sessionIO, sessionType })
      })
    })
    
    setInterval(() => {
      const now = new Date()
      for (const [sessionId, session] of activeSessions.entries()) {
        const sessionAge = now - session.createdAt
        if (sessionAge > SESSION_MAX_AGE) {
          activeSessions.delete(sessionId)
        }
      }
    }, SESSION_CLEANUP_INTERVAL)
  }

  // We only send a cancellation message if both users haven't accepted results
  // If both users have accepted, the session is completed successfully        
  const sendCancellationMessage = (sessionId, session, characterName) => {
    const bothUsersAccepted = session.users.length === 2 && 
                             session.users.every(user => user.accepted === true)
    
    if (!bothUsersAccepted) {
      sessionIO.to(sessionId).emit('session-cancelled', { 
        message: `Opponent has left the ${sessionType}`,
        characterName: characterName
      })
    }
  }

  // Handlers used by all session types
  const setupCommonHandlers = (socket) => {

    socket.on('auto-join-or-create', (data) => {
      if (availableSessionId && activeSessions.has(availableSessionId)) {
        const session = activeSessions.get(availableSessionId)
        
        // Ensure the session is still waiting for a second user
        if (session.users.length === 1 && session.status === SESSION_STATUS.WAITING) {
          const userData = createUserData(data, socket.id)
          session.users.push(userData)
          
          // When the second user joins, the session becomes ACTIVE
          session.status = SESSION_STATUS.ACTIVE
          socket.join(availableSessionId)
          
          sessionIO.to(availableSessionId).emit('session-updated', { 
            sessionId: availableSessionId, 
            session 
          })
          
          availableSessionId = null
          
          return
        }
      }
      
      // No available session, create a new one, with status WAITING
      const sessionId = uuidv4()
      const userData = createUserData(data, socket.id)
      
      const newSession = {
        id: sessionId,
        createdAt: new Date(),
        users: [userData],
        status: SESSION_STATUS.WAITING
      }
      
      // Store and announce the new session
      activeSessions.set(sessionId, newSession)
      availableSessionId = sessionId
      socket.join(sessionId)
      socket.emit('session-created', { sessionId, session: newSession })
    })

    socket.on('disconnect', () => {
      for (const [sessionId, session] of activeSessions.entries()) {
        const userIndex = session.users.findIndex(user => user.socketId === socket.id)
        
        if (userIndex !== -1) {
          const leavingUser = session.users[userIndex]
          const characterName = leavingUser.characterInfo?.name
          
          session.users.splice(userIndex, 1)
          
          if (sessionId === availableSessionId && session.users.length === 0) {
            availableSessionId = null
          }
          
          // If no users remain, delete the session entirely
          // Otherwise, notify remaining user of cancellation
          if (session.users.length === 0) {
            activeSessions.delete(sessionId)
          } else {
            sendCancellationMessage(sessionId, session, characterName)
          }
          break
        }
      }
    })

    socket.on('cancel-session', ({ sessionId }) => {
      if (activeSessions.has(sessionId)) {
        const session = activeSessions.get(sessionId)
        
        const cancellingUser = session.users.find(user => user.socketId === socket.id)
        const characterName = cancellingUser?.characterInfo?.name
        
        // Notify users of cancellation if needed
        sendCancellationMessage(sessionId, session, characterName)
        
        activeSessions.delete(sessionId)
      }
    })

    socket.on('acceptance-state-updated', ({ sessionId, characterId, accepted }) => {
      if (activeSessions.has(sessionId)) {
        const session = activeSessions.get(sessionId)
        
        const user = session.users.find(u => u.characterInfo.id === characterId)
        if (user) {
          user.accepted = accepted
        }
        
        socket.to(sessionId).emit('acceptance-state-updated', { characterId, accepted })
      }
    })
  }

  return {
    setupSocketHandlers,
    getActiveSessions: () => activeSessions,
    getSessionIO: () => sessionIO
  }
}

export const setupOpposedSkillCheckHandlers = createSessionController(opposedSkillCheckConfig).setupSocketHandlers
export const setupEngagementHandlers = createSessionController(engagementConfig).setupSocketHandlers
