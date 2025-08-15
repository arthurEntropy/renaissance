import { v4 as uuidv4 } from 'uuid'
import { SESSION_STATUS } from '../../../shared/constants/sessionStatus.js'

const activeSessions = new Map()
let engagementIO = null

const SESSION_CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 minutes
const SESSION_MAX_AGE = 30 * 60 * 1000 // 30 minutes
const ROLL_DELAY = 1500 // 1.5 seconds

const setupSocketHandlers = (io) => {
  engagementIO = io.of('/engagement')
  let availableSessionId = null
  
  engagementIO.on('connection', (socket) => {
    socket.on('auto-join-or-create', ({ characterInfo, selectedDice, engagementSuccesses }) => {
      if (availableSessionId && activeSessions.has(availableSessionId)) {
        const session = activeSessions.get(availableSessionId)
        
        if (session.users.length === 1 && session.status === SESSION_STATUS.WAITING) {
          session.users.push({
            socketId: socket.id,
            characterInfo,
            selectedDice,
            engagementSuccesses,
            ready: true
          })
          
          session.status = SESSION_STATUS.ACTIVE
          socket.join(availableSessionId)
          
          engagementIO.to(availableSessionId).emit('session-updated', { 
            sessionId: availableSessionId, 
            session 
          })
          
          const joinedSessionId = availableSessionId
          availableSessionId = null
          
          setTimeout(() => {
            const currentSession = activeSessions.get(joinedSessionId)
            if (currentSession && currentSession.users.length === 2) {
              performRoll(joinedSessionId)
            }
          }, ROLL_DELAY)
          return
        }
      }
      const sessionId = uuidv4()
      
      const newSession = {
        id: sessionId,
        createdAt: new Date(),
        users: [
          {
            socketId: socket.id,
            characterInfo,
            selectedDice,
            engagementSuccesses,
            ready: true
          }
        ],
        status: SESSION_STATUS.WAITING
      }
      
      activeSessions.set(sessionId, newSession)
      availableSessionId = sessionId
      socket.join(sessionId)
      socket.emit('session-created', { sessionId, session: newSession })
    })
    
    socket.on('disconnect', () => {
      for (const [sessionId, session] of activeSessions.entries()) {
        const userIndex = session.users.findIndex(user => user.socketId === socket.id)
        
        if (userIndex !== -1) {
          const bothUsersAccepted = session.users.length === 2 && 
                                   session.users.every(user => user.accepted === true)
          
          const leavingUser = session.users[userIndex]
          const characterName = leavingUser.characterInfo?.name
          
          session.users.splice(userIndex, 1)
          
          if (sessionId === availableSessionId && session.users.length === 0) {
            availableSessionId = null
          }
          
          if (session.users.length === 0) {
            activeSessions.delete(sessionId)
          } else if (!bothUsersAccepted) {
            engagementIO.to(sessionId).emit('session-cancelled', { 
              message: 'Opponent has left the engagement',
              characterName: characterName
            })
          }
        }
      }
    })
    
    socket.on('cancel-session', ({ sessionId }) => {
      if (activeSessions.has(sessionId)) {
        const session = activeSessions.get(sessionId)
        
        const bothUsersAccepted = session.users.length === 2 && 
                                 session.users.every(user => user.accepted === true)
        
        const cancellingUser = session.users.find(user => user.socketId === socket.id)
        const characterName = cancellingUser?.characterInfo?.name
        
        if (!bothUsersAccepted) {
          engagementIO.to(sessionId).emit('session-cancelled', { 
            message: 'Opponent has left the engagement.',
            characterName: characterName
          })
        }
        
        activeSessions.delete(sessionId)
      }
    })
    
    socket.on('update-result-indicator', ({ sessionId, index, state }) => {
      if (activeSessions.has(sessionId)) {
        socket.to(sessionId).emit('result-indicator-updated', { index, state })
      }
    })

    socket.on('reroll-die', ({ sessionId, player, diceIndex, newValue, characterId }) => {
      if (activeSessions.has(sessionId)) {
        socket.to(sessionId).emit('die-rerolled', { player, diceIndex, newValue, characterId })
      }
    })

    socket.on('success-assignment-updated', ({ sessionId, characterId, player, diceIndex, successId }) => {
      if (activeSessions.has(sessionId)) {
        socket.to(sessionId).emit('success-assignment-updated', { characterId, player, diceIndex, successId })
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

function performRoll(sessionId) {
  const session = activeSessions.get(sessionId)
  if (!session) {
    return
  }
  
  session.status = SESSION_STATUS.ROLLING
  
  session.users.forEach(user => {
    user.rollResults = user.selectedDice.map(die => {
      return Math.floor(Math.random() * die) + 1
    })
    
    user.rollTotal = user.rollResults.reduce((sum, value) => sum + value, 0)
  })
  
  if (session.users[0].rollTotal > session.users[1].rollTotal) {
    session.winner = 0
  } else if (session.users[1].rollTotal > session.users[0].rollTotal) {
    session.winner = 1
  } else {
    session.winner = -1
  }
  
  session.status = SESSION_STATUS.COMPLETED
  
  if (engagementIO) {
    engagementIO.to(sessionId).emit('roll-results', { 
      session,
      timestamp: new Date()
    })
  } else {
    console.error('Cannot emit results: engagementIO is not initialized')
  }
}

export {
  setupSocketHandlers
}
