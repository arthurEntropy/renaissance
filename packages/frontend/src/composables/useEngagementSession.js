import { watch, computed, ref } from 'vue'
import engagementSessionService from '@/services/sessions/engagementSessionService'
import EngagementRollService from '@/services/rolls/engagementRollService'
import DiceRoller from '@/services/rolls/utils/DiceRoller.js'
import DiceFormatter from '@/services/rolls/utils/DiceFormatter.js'
import DiceProcessor from '@/services/rolls/utils/DiceProcessor.js'
import { EngagementResultTypes } from '@/constants/engagementResultTypes'
import { WINNER } from '@shared/constants/winner.js'
import { RollTypes } from '@/constants/rollTypes'
import { DICE_ROLL_DURATION } from '@/constants/animationDurations'
import { useBaseSession } from './useBaseSession.js'
import { useEngagementRoll } from './useEngagementRoll.js'
import { useEngagementSuccesses } from './useEngagementSuccesses.js'
import { useRollsStore } from '@/stores/rollsStore'
import { SESSION_STATUS } from '@shared/constants/sessionStatus.js'
import { SESSION_EVENTS } from '@shared/constants/sessionEvents.js'

// Singleton instance
let engagementSessionInstance = null

export function useEngagementSession() {
  // Return existing instance if already created
  if (engagementSessionInstance) {
    return engagementSessionInstance
  }

  // Use base session functionality
  const baseSession = useBaseSession(engagementSessionService)
  
  // Get domain composables for coordinating their state
  const diceManager = useEngagementRoll()
  const successManager = useEngagementSuccesses()
  const rollsStore = useRollsStore()
  
  // Store character for use in event handlers
  const currentCharacter = ref(null)

  // Computed properties for session-specific UI state
  const shouldShowComparisons = computed(() => {
    return baseSession.showResults.value && baseSession.opponent.value
  })

  const shouldShowResolution = computed(() => {
    return baseSession.opponent.value
  })
  
  // Expose the current engagement dice from diceManager
  const engagementDice = computed(() => diceManager.committedDice.value)

  function generateEngagementResults(winner, userWins, opponentWins, drawCount, character, opponent) {
    if (!opponent || !baseSession.showResults.value) {
      return null
    }

    // Determine the result from the user's perspective
    let result
    switch (winner) {
      case WINNER.USER:
        result = EngagementResultTypes.WIN
        break
      case WINNER.OPPONENT:
        result = EngagementResultTypes.LOSS
        break
      case WINNER.TIE:
        result = EngagementResultTypes.DRAW
        break
      default:
        result = EngagementResultTypes.DRAW
    }

    // Extract user's dice from session data for display
    let userDiceResults = null
    if (baseSession.rollResults.value?.session?.users) {
      const userSession = baseSession.rollResults.value.session.users.find(
        u => u.characterInfo.id === character.id
      )
      if (userSession?.rollResults) {
        // Format the dice for display (add CSS classes, emojis, sort)
        userDiceResults = [...userSession.rollResults]
        DiceProcessor.markMaxValueDice(userDiceResults)
        DiceFormatter.addDisplayData(userDiceResults, RollTypes.ENGAGEMENT)
        DiceFormatter.sortByRollType(userDiceResults, RollTypes.ENGAGEMENT)
      }
    }

    // Format the engagement result
    const engagementResult = {
      type: RollTypes.ENGAGEMENT,
      characterName: character.name,
      opponentName: opponent.characterInfo.name,
      result: result,
      userWins: userWins,
      opponentWins: opponentWins,
      drawCount: drawCount,
      diceResults: userDiceResults, // Add user's dice for display in DiceBox
      timestamp: Date.now()
    }

    // Emit engagement results
    EngagementRollService.emitEngagementResult(engagementResult)

    return engagementResult
  }
  
  // Generate results when both users accept (computes winCounts internally)
  function generateResultsOnAccept(character, opponent) {
    if (!baseSession.bothUsersAccepted.value) {
      return null
    }
    
    const winCounts = diceManager.getWinCounts(baseSession, character, diceManager.committedDice.value)
    const winner = diceManager.getEngagementWinner(baseSession, character, diceManager.committedDice.value)
    
    const result = generateEngagementResults(
      winner,
      winCounts.userWins,
      winCounts.opponentWins,
      winCounts.draws,
      character,
      opponent
    )
    
    // Automatically save result to rollsStore
    if (result) {
      rollsStore.setRoll(result)
    }
    
    return result
  }

  function initializeSession(character, selectedDice, characterSuccessIds, _resultIndicatorCallback, _dieRerolledCallback, _successAssignmentCallback, _rollResultsCallback) {
    // Reset acceptance state for fresh session
    baseSession.resetAcceptanceState()
    
    // Store character and dice for internal handlers
    currentCharacter.value = character
    diceManager.committedDice.value = selectedDice
    
    // Setup event listeners - all handled internally now
    const callbacks = {
      sessionType: 'engagement',
      onRollResults: ({ session }) => {
        baseSession.rollResults.value = { session }
        baseSession.sessionStatus.value = SESSION_STATUS.COMPLETED
        
        // Automatically mark selected dice as expended
        diceManager.markSelectedDiceAsExpended()
        
        // Reset dice and success state for new results
        diceManager.resetSortingState()
        successManager.resetAssignments()
      },
      onAcceptanceStateUpdated: ({ _characterId, accepted }) => {
        // When opponent accepts, check if both users have now accepted
        // This ensures the first user to accept also gets results when the second user accepts
        if (accepted && baseSession.userAccepted.value && baseSession.opponentAccepted.value) {
          generateResultsOnAccept(currentCharacter.value, baseSession.opponent.value)
        }
      }
    }

    baseSession.setupBaseEventHandlers(character, callbacks)

    // Setup engagement specific event handlers
    setupEngagementSpecificHandlers(selectedDice, character, characterSuccessIds)
    
    // Initialize connection and auto-join
    baseSession.initializeConnection(() => {
      engagementSessionService.autoJoinOrCreate(character, selectedDice, characterSuccessIds)
    })
  }

  function setupEngagementSpecificHandlers(selectedDice, currentCharacter, _characterSuccessIds) {
    // Watch for session status changes to trigger rolling
    watch(() => baseSession.sessionStatus.value, (newStatus, oldStatus) => {
      // When session becomes ACTIVE and we haven't rolled yet, start rolling
      if (newStatus === SESSION_STATUS.ACTIVE && oldStatus === SESSION_STATUS.WAITING) {
        // Generate roll results
        const dicePool = selectedDice.map((die, index) => ({
          ...die,
          poolIndex: index
        }))
        
        const diceResults = DiceRoller.rollPool(dicePool)
        const totalSum = diceResults.reduce((sum, die) => sum + die.dieRollValue, 0)
        
        const rollResult = {
          diceResults,
          totalSum
        }
        
        // Wait for roll animation duration before submitting results
        setTimeout(() => {
          engagementSessionService.submitRollResults(rollResult, currentCharacter.id)
        }, DICE_ROLL_DURATION)
      }
    })

    // Watch for when both users have results to calculate winner and complete session
    watch(() => baseSession.sessionData.value?.users, (users) => {
      if (users?.length === 2 && users.every(u => u.rollResults && u.rollTotal !== undefined)) {
        
        // Only complete if session is still active (not already completed)
        if (baseSession.sessionStatus.value === SESSION_STATUS.ACTIVE) {
          // Calculate winner based on total sums
          let winner
          if (users[0].rollTotal > users[1].rollTotal) {
            winner = 0
          } else if (users[1].rollTotal > users[0].rollTotal) {
            winner = 1
          } else {
            winner = -1 // tie
          }
          
          // Complete the session with the calculated winner
          engagementSessionService.completeSession(winner)
        }
      }
    }, { deep: true, immediate: true })

    // Dice comparison indicator updated handler - route to dice manager
    const resultIndicatorHandler = ({ index, state }) => {
      diceManager.handleRemoteResultUpdate(index, state)
    }

    // Die rerolled handler - route to dice manager
    const dieRerolledHandler = ({ player, diceIndex, newValue, characterId }) => {
      if (characterId === currentCharacter.id) return // Don't process our own rerolls

      const sortedOpponentDice = diceManager.getSortedOpponentDice(
        baseSession.opponent.value,
        baseSession.sessionData?.value,
        baseSession.rollResults.value,
        currentCharacter.id
      )

      diceManager.handleRemoteDieReroll(
        player,
        diceIndex,
        newValue,
        characterId,
        currentCharacter.id,
        sortedOpponentDice,
        baseSession.rollResults.value,
        baseSession.opponent.value,
        DICE_ROLL_DURATION,
        { startRerolling: diceManager.startRerolling, stopRerolling: diceManager.stopRerolling }
      )
    }

    // Success assignment updated handler - route to success manager
    const successAssignmentHandler = ({ characterId, player, diceIndex, successId }) => {
      successManager.handleRemoteAssignment(
        characterId,
        player,
        diceIndex,
        successId,
        currentCharacter.id,
        baseSession.opponent.value
      )
    }

    // Register the handlers
    engagementSessionService.on(SESSION_EVENTS.RESULT_INDICATOR_UPDATED, resultIndicatorHandler)
    engagementSessionService.on(SESSION_EVENTS.DIE_REROLLED, dieRerolledHandler)
    engagementSessionService.on(SESSION_EVENTS.SUCCESS_ASSIGNMENT_UPDATED, successAssignmentHandler)

    // Store handlers for cleanup
    baseSession.eventHandlers.resultIndicatorUpdated = resultIndicatorHandler
    baseSession.eventHandlers.dieRerolled = dieRerolledHandler
    baseSession.eventHandlers.successAssignmentUpdated = successAssignmentHandler
  }

  function cleanupEventListeners() {
    // Clean up base event listeners
    baseSession.cleanupEventListeners()

    // Clean up engagement specific handlers
    if (baseSession.eventHandlers.resultIndicatorUpdated) {
      engagementSessionService.off(SESSION_EVENTS.RESULT_INDICATOR_UPDATED, baseSession.eventHandlers.resultIndicatorUpdated)
    }
    if (baseSession.eventHandlers.dieRerolled) {
      engagementSessionService.off(SESSION_EVENTS.DIE_REROLLED, baseSession.eventHandlers.dieRerolled)
    }
    if (baseSession.eventHandlers.successAssignmentUpdated) {
      engagementSessionService.off(SESSION_EVENTS.SUCCESS_ASSIGNMENT_UPDATED, baseSession.eventHandlers.successAssignmentUpdated)
    }
  }

  function disconnect() {
    cleanupEventListeners()
    engagementSessionService.disconnect()
  }
  
  // Simplified initialize method (public API)
  function initialize(character, selectedDice) {
    const characterSuccessIds = successManager.allOwnedEngagementSuccesses.value.map(s => s.id)
    initializeSession(character, selectedDice, characterSuccessIds)
  }
  
  // Cleanup method (public API)
  function cleanup() {
    disconnect()
  }

  // Create the return object
  const returnObject = {
    // State from base
    sessionId: baseSession.sessionId,
    sessionStatus: baseSession.sessionStatus,
    sessionData: baseSession.sessionData,
    opponent: baseSession.opponent,
    rollResults: baseSession.rollResults,
    userAccepted: baseSession.userAccepted,
    opponentAccepted: baseSession.opponentAccepted,
    
    // Engagement-specific state
    engagementDice,
    
    // Result generation
    generateResultsOnAccept,
    
    // Computed from base
    bothUsersAccepted: baseSession.bothUsersAccepted,
    canEditResults: baseSession.canEditResults,
    showResults: baseSession.showResults,
    shouldShowExitConfirmation: baseSession.shouldShowExitConfirmation,
    shouldShowCancelButton: baseSession.shouldShowCancelButton,
    
    // Session-specific computed properties
    shouldShowComparisons,
    shouldShowResolution,
    
    // Methods from base
    updateUserAcceptance: baseSession.updateUserAcceptance,
    cancelSession: baseSession.cancelSession,
    
    // Public API methods
    initialize,
    cleanup,
    
    // Legacy methods (for compatibility during transition)
    initializeSession,
    generateEngagementResults,
    cleanupEventListeners,
    disconnect
  }
  
  // Store and return singleton instance
  engagementSessionInstance = returnObject
  return returnObject
}
