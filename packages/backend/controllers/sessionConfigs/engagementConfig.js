import { SESSION_STATUS } from '../../../../shared/constants/sessionStatus.js'
import { SESSION_EVENTS } from '../../../../shared/constants/sessionEvents.js'

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
      socket.on(SESSION_EVENTS.RESULT_INDICATOR_UPDATED, ({ sessionId, index, state }) => {
        if (activeSessions.has(sessionId)) {
          socket.to(sessionId).emit(SESSION_EVENTS.RESULT_INDICATOR_UPDATED, { index, state })
        }
      })
    },
    
    (socket, { activeSessions, sessionIO }) => {
      socket.on(SESSION_EVENTS.SUBMIT_ROLL_RESULTS, ({ sessionId, rollResults, characterId }) => {
        if (activeSessions.has(sessionId)) {
          const session = activeSessions.get(sessionId)
          if (!session) return

          // Find the user
          const user = session.users.find(u => u.characterInfo.id === characterId)
          if (!user) return

          // Store roll results in session state
          // rollResults.diceResults is an array of DieResult objects from DiceRoller
          user.rollResults = rollResults.diceResults || []
          user.rollTotal = rollResults.diceResults
            ? rollResults.diceResults.reduce((sum, die) => sum + (die.dieRollValue || 0), 0)
            : 0

          // Emit session update so both players see the new session state
          sessionIO.to(sessionId).emit(SESSION_EVENTS.SESSION_UPDATED, { 
            sessionId, 
            session 
          })
        }
      })
    },
    
    (socket, { activeSessions, sessionIO }) => {
      socket.on(SESSION_EVENTS.COMPLETE_SESSION, ({ sessionId, winner }) => {
        const session = activeSessions.get(sessionId)

        // If session exists and is active, store the winner and mark complete
        if (session && session.status === SESSION_STATUS.ACTIVE) {
          session.winner = winner
          session.status = SESSION_STATUS.COMPLETED
          sessionIO.to(sessionId).emit(SESSION_EVENTS.SESSION_COMPLETED, { 
            session,
            timestamp: new Date()
          })
        }
      })
    },
    
    (socket, { activeSessions }) => {
      socket.on(SESSION_EVENTS.SUCCESS_ASSIGNMENT_UPDATED, ({ sessionId, characterId, player, diceIndex, successId }) => {
        if (activeSessions.has(sessionId)) {
          socket.to(sessionId).emit(SESSION_EVENTS.SUCCESS_ASSIGNMENT_UPDATED, { characterId, player, diceIndex, successId })
        }
      })
    },
    
    (socket, { activeSessions, sessionIO }) => {
      socket.on(SESSION_EVENTS.REROLL_DIE, ({ sessionId, player, diceIndex, newValue, characterId }) => {
        if (activeSessions.has(sessionId)) {
          const session = activeSessions.get(sessionId)
          
          // Find the user who rerolled
          const user = session.users.find(u => u.characterInfo.id === characterId)
          if (user && user.rollResults && user.rollResults[diceIndex] !== undefined) {
            
            // Update the DieResult object
            user.rollResults[diceIndex].dieRollValue = newValue
            user.rollResults[diceIndex].originalDieRollValue = newValue
            user.rollResults[diceIndex].rolledMaxValue = newValue === user.rollResults[diceIndex].die.dieSize
            
            // Recalculate total from DieResult objects
            user.rollTotal = user.rollResults.reduce((sum, die) => sum + (die.dieRollValue || 0), 0)
            
            // Emit session update so both players see the new session state
            sessionIO.to(sessionId).emit(SESSION_EVENTS.SESSION_UPDATED, { 
              sessionId, 
              session 
            })
            
            // Also emit the die-rerolled event for any UI animations
            sessionIO.to(sessionId).emit(SESSION_EVENTS.DIE_REROLLED, { player, diceIndex, newValue, characterId })
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
