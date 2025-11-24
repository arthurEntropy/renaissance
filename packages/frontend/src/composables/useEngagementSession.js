import { watch, computed } from 'vue'
import engagementSessionService from '@/services/sessions/engagementSessionService'
import EngagementRollService from '@/services/rolls/engagementRollService'
import EngagementResultTypes from '@/constants/engagementResultTypes'
import EngagementWinnerTypes from '@/constants/engagementWinnerTypes'
import RollTypes from '@/constants/rollTypes'
import { DICE_ROLL_DURATION } from '@/constants/animationDurations'
import { rollSingleDie } from '@/utils/diceUtils'
import { useBaseSession } from './useBaseSession.js'
import { SESSION_STATUS } from '@shared/constants/sessionStatus.js'

export function useEngagementSession() {
  // Use base session functionality
  const baseSession = useBaseSession(engagementSessionService)

  // Computed properties for session-specific UI state
  const shouldShowComparisons = computed(() => {
    return baseSession.showResults.value && baseSession.opponent.value
  })

  const shouldShowResolution = computed(() => {
    return baseSession.opponent.value
  })

  function generateEngagementResults(winner, userWins, opponentWins, drawCount, character, opponent) {
    if (!opponent || !baseSession.showResults.value) {
      return null
    }

    // Determine the result from the user's perspective
    let result
    switch (winner) {
      case EngagementWinnerTypes.USER:
        result = EngagementResultTypes.WIN
        break
      case EngagementWinnerTypes.OPPONENT:
        result = EngagementResultTypes.LOSS
        break
      case EngagementWinnerTypes.TIE:
        result = EngagementResultTypes.DRAW
        break
      default:
        result = EngagementResultTypes.DRAW
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
      timestamp: Date.now()
    }

    // Send engagement results to Discord
    EngagementRollService.sendEngagementResultsToServer(engagementResult)

    return engagementResult
  }

  function initializeSession(character, selectedDice, characterSuccessIds, resultIndicatorCallback, dieRerolledCallback, successAssignmentCallback, rollResultsCallback) {
    // Reset acceptance state for fresh session
    baseSession.resetAcceptanceState()
    
    // Setup event listeners with engagement specific callbacks
    const callbacks = {
      sessionType: 'engagement',
      onRollResults: rollResultsCallback,
      onResultIndicatorUpdated: resultIndicatorCallback,
      onDieRerolled: dieRerolledCallback
    }

    baseSession.setupBaseEventHandlers(character, callbacks)

    // Setup engagement specific event handlers
    setupEngagementSpecificHandlers(selectedDice, character, successAssignmentCallback)
    
    // Initialize connection and auto-join
    baseSession.initializeConnection(() => {
      engagementSessionService.autoJoinOrCreate(character, selectedDice, characterSuccessIds)
    })
  }

  function setupEngagementSpecificHandlers(selectedDice, currentCharacter, successAssignmentCallback) {
    // Watch for session status changes to trigger rolling
    watch(() => baseSession.sessionStatus.value, (newStatus, oldStatus) => {
      // When session becomes ACTIVE and we haven't rolled yet, start rolling
      if (newStatus === SESSION_STATUS.ACTIVE && oldStatus === SESSION_STATUS.WAITING) {
        // Generate roll results for engagement using selected dice
        const diceResults = selectedDice.map(dieSize => 
          rollSingleDie(dieSize)
        )
        
        const rollResult = {
          diceResults,
          totalSum: diceResults.reduce((sum, value) => sum + value, 0)
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

    // Success assignment updated handler
    const successAssignmentHandler = ({ characterId, player, diceIndex, successId }) => {
      if (successAssignmentCallback) {
        successAssignmentCallback({ characterId, player, diceIndex, successId })
      }
    }

    // Register the handlers
    engagementSessionService.on('success-assignment-updated', successAssignmentHandler)

    // Store handlers for cleanup
    baseSession.eventHandlers.successAssignmentUpdated = successAssignmentHandler
  }

  function cleanupEventListeners() {
    // Clean up base event listeners
    baseSession.cleanupEventListeners()

    // Clean up engagement specific handlers
    if (baseSession.eventHandlers.successAssignmentUpdated) {
      engagementSessionService.off('success-assignment-updated', baseSession.eventHandlers.successAssignmentUpdated)
    }
  }

  function disconnect() {
    cleanupEventListeners()
    engagementSessionService.disconnect()
  }

  return {
    // State from base
    sessionId: baseSession.sessionId,
    sessionStatus: baseSession.sessionStatus,
    sessionData: baseSession.sessionData,
    opponent: baseSession.opponent,
    rollResults: baseSession.rollResults,
    userAccepted: baseSession.userAccepted,
    opponentAccepted: baseSession.opponentAccepted,
    
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
    
    // Specific methods
    generateEngagementResults,
    initializeSession,
    cleanupEventListeners,
    disconnect
  }
}
