import { SESSION_STATUS } from '../../../../shared/constants/sessionStatus.js'

export const engagementConfig = {
  namespace: '/engagement',
  sessionType: 'engagement',
  
  createUserData: (data, socketId) => ({
    socketId,
    characterInfo: data.characterInfo,
    selectedDice: data.selectedDice,
    engagementSuccesses: data.engagementSuccesses,
    ready: true
  }),

  additionalSocketHandlers: [

    (socket, { activeSessions }) => {
      socket.on('update-result-indicator', ({ sessionId, index, state }) => {
        if (activeSessions.has(sessionId)) {
          socket.to(sessionId).emit('result-indicator-updated', { index, state })
        }
      })
    },
    
    (socket, { activeSessions, sessionIO }) => {
      socket.on('submit-roll-results', ({ sessionId, rollResults, characterId }) => {
        if (activeSessions.has(sessionId)) {
          const session = activeSessions.get(sessionId)
          if (!session) return

          // Find the user
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
    
    (socket, { activeSessions }) => {
      socket.on('success-assignment-updated', ({ sessionId, characterId, player, diceIndex, successId }) => {
        if (activeSessions.has(sessionId)) {
          socket.to(sessionId).emit('success-assignment-updated', { characterId, player, diceIndex, successId })
        }
      })
    },
    
    (socket, { activeSessions, sessionIO }) => {
      socket.on('reroll-die', ({ sessionId, player, diceIndex, newValue, characterId }) => {
        if (activeSessions.has(sessionId)) {
          const session = activeSessions.get(sessionId)
          
          // Find the user who rerolled
          const user = session.users.find(u => u.characterInfo.id === characterId)
          if (user && user.rollResults && user.rollResults[diceIndex] !== undefined) {
            
            // Update the specific die value
            user.rollResults[diceIndex] = newValue
            
            // Recalculate the total
            user.rollTotal = user.rollResults.reduce((sum, value) => sum + value, 0)
            
            // Emit session update so both players see the new session state
            sessionIO.to(sessionId).emit('session-updated', { 
              sessionId, 
              session 
            })
            
            // Also emit the die-rerolled event for any UI animations
            sessionIO.to(sessionId).emit('die-rerolled', { player, diceIndex, newValue, characterId })
          } else {
            console.log('❌ Cannot reroll die: invalid user or rollResults state')
          }
        } else {
          console.log('❌ Session not found:', sessionId)
        }
      })
    }
  ]
}
