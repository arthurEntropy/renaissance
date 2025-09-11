import { SESSION_STATUS } from '../../../../shared/constants/sessionStatus.js'

export const opposedSkillCheckConfig = {
  namespace: '/opposed-skill-check',
  sessionType: 'opposed skill check',
  
  createUserData: (data, socketId) => ({
    socketId,
    characterInfo: data.characterInfo,
    skillCheckConfig: data.skillCheckConfig,
    ready: true
  }),

  additionalSocketHandlers: [

    (socket, { activeSessions, sessionIO }) => {
      socket.on('submit-roll-results', ({ sessionId, rollResults, characterId }) => {
        if (activeSessions.has(sessionId)) {
          const session = activeSessions.get(sessionId)
          if (!session) return

          // Find the user and store their roll results
          const user = session.users.find(u => u.characterInfo.id === characterId)
          if (!user) return

          // Store roll results in session state
          user.rollResults = rollResults.diceResults
          user.rollTotal = rollResults.totalSum

          // Emit session update so both players see the new session state
          sessionIO.to(sessionId).emit('session-updated', { 
            sessionId, 
            session 
          })
        }
      })
    },

    (socket, { activeSessions, sessionIO }) => {
      socket.on('complete-session', ({ sessionId, winner }) => {
        const session = activeSessions.get(sessionId)
        // If session exists and is active, store the winner and mark complete
        if (session && session.status === SESSION_STATUS.ACTIVE) {
          session.winner = winner
          session.status = SESSION_STATUS.COMPLETED
          sessionIO.to(sessionId).emit('roll-results', { 
            session,
            timestamp: new Date()
          })
        }
      })
    },

    // Handle skill check rerolls
    (socket, { activeSessions, sessionIO }) => {
      socket.on('reroll-skill-check', ({ sessionId, rerollingCharacterId }) => {
        if (activeSessions.has(sessionId)) {
          const session = activeSessions.get(sessionId)
          if (!session || session.users.length !== 2) return

          // Find which user is rerolling
          const rerollingUserIndex = session.users.findIndex(user => user.characterInfo.id === rerollingCharacterId)
          if (rerollingUserIndex === -1) return

          // Clear the rerolling user's results
          const rerollingUser = session.users[rerollingUserIndex]
          rerollingUser.rollResults = null
          rerollingUser.rollTotal = undefined

          // Set session status back to ACTIVE so frontend knows reroll is in progress
          session.status = SESSION_STATUS.ACTIVE

          // Emit session update so frontend sees the cleared results
          sessionIO.to(sessionId).emit('session-updated', { 
            sessionId, 
            session 
          })

          // Signal the rerolling client to perform their new roll
          sessionIO.to(sessionId).emit('start-reroll', { 
            sessionId,
            rerollingCharacterId,
            timestamp: new Date()
          })
        }
      })
    }
  ]
}
