import { ref, reactive, computed } from 'vue'
import engagementService from '@/services/EngagementService'

/**
 * Composable for managing engagement session state and WebSocket events
 */
export function useEngagementSession() {
  // Session state
  const sessionId = ref(null)
  const sessionStatus = ref('waiting')
  const opponent = ref(null)
  const rollResults = ref(null)
  const userAccepted = ref(false)
  const opponentAccepted = ref(false)

  // Event handler references for cleanup
  const eventHandlers = reactive({
    sessionCreated: null,
    sessionUpdated: null,
    userLeft: null,
    sessionCancelled: null,
    rollResults: null,
    resultIndicatorUpdated: null,
    dieRerolled: null,
    successAssignmentUpdated: null,
    acceptanceStateUpdated: null
  })

  /**
   * Initialize session and setup event listeners
   * @param {Object} character - User's character object
   * @param {Array} selectedDice - Array of selected dice
   * @param {Array} characterSuccessIds - Array of character success IDs
   */
  function initSession(character, selectedDice, characterSuccessIds) {
    // Connect to WebSocket server
    engagementService.connect()

    // Setup event listeners
    setupEngagementListeners(character)

    // Auto-join or create session
    engagementService.autoJoinOrCreate(character, selectedDice, characterSuccessIds)
  }

  /**
   * Setup all WebSocket event listeners
   * @param {Object} character - User's character object
   */
  function setupEngagementListeners(character) {
    // Session created handler
    eventHandlers.sessionCreated = ({ sessionId: newSessionId, session }) => {
      sessionId.value = newSessionId
      sessionStatus.value = session.state
    }

    // Session updated handler
    eventHandlers.sessionUpdated = ({ session }) => {
      sessionId.value = session.id
      sessionStatus.value = session.state

      // Find opponent (the other user in the session)
      if (session.users && session.users.length === 2) {
        const otherUser = session.users.find(user =>
          user.characterInfo.id !== character.id)

        if (otherUser) {
          opponent.value = otherUser
        }
      }
    }

    // User left handler
    eventHandlers.userLeft = ({ message, characterName }) => {
      opponent.value = null
      sessionStatus.value = 'waiting'
      const alertMessage = characterName ? `${characterName} has exited the engagement.` : message
      alert(alertMessage)
    }

    // Session cancelled handler
    eventHandlers.sessionCancelled = ({ message, characterName }) => {
      const alertMessage = characterName ? `${characterName} has exited the engagement.` : message
      alert(alertMessage)
      sessionId.value = null
      sessionStatus.value = 'waiting'
      opponent.value = null
    }

    // Roll results handler
    eventHandlers.rollResults = ({ session }) => {
      sessionStatus.value = 'completed'
      rollResults.value = { session }
    }

    // Acceptance state updated handler
    eventHandlers.acceptanceStateUpdated = ({ characterId, accepted }) => {
      // Don't process our own acceptance state updates
      if (characterId === character.id) {
        return
      }

      // Update opponent's acceptance state
      if (opponent.value && characterId === opponent.value.characterInfo.id) {
        opponentAccepted.value = accepted
      }
    }

    // Register all event listeners
    engagementService.on('session-created', eventHandlers.sessionCreated)
    engagementService.on('session-updated', eventHandlers.sessionUpdated)
    engagementService.on('user-left', eventHandlers.userLeft)
    engagementService.on('session-cancelled', eventHandlers.sessionCancelled)
    engagementService.on('roll-results', eventHandlers.rollResults)
    engagementService.on('acceptance-state-updated', eventHandlers.acceptanceStateUpdated)
  }

  /**
   * Register additional event handlers for dice and success management
   * @param {Function} resultIndicatorHandler - Handler for result indicator updates
   * @param {Function} dieRerolledHandler - Handler for die reroll events
   * @param {Function} successAssignmentHandler - Handler for success assignment updates
   */
  function registerAdditionalHandlers(resultIndicatorHandler, dieRerolledHandler, successAssignmentHandler) {
    if (resultIndicatorHandler) {
      eventHandlers.resultIndicatorUpdated = resultIndicatorHandler
      engagementService.on('result-indicator-updated', eventHandlers.resultIndicatorUpdated)
    }

    if (dieRerolledHandler) {
      eventHandlers.dieRerolled = dieRerolledHandler
      engagementService.on('die-rerolled', eventHandlers.dieRerolled)
    }

    if (successAssignmentHandler) {
      eventHandlers.successAssignmentUpdated = successAssignmentHandler
      engagementService.on('success-assignment-updated', eventHandlers.successAssignmentUpdated)
    }
  }

  /**
   * Register a custom roll results handler
   * @param {Function} customHandler - Custom roll results handler
   */
  function registerRollResultsHandler(customHandler) {
    if (customHandler) {
      // Remove existing handler if any
      if (eventHandlers.rollResults) {
        engagementService.off('roll-results', eventHandlers.rollResults)
      }
      
      // Register the custom handler
      eventHandlers.rollResults = customHandler
      engagementService.on('roll-results', eventHandlers.rollResults)
    }
  }

  /**
   * Update user's acceptance state
   * @param {string} characterId - Character ID
   * @param {boolean} accepted - Acceptance state
   */
  function updateUserAcceptance(characterId, accepted) {
    userAccepted.value = accepted
    engagementService.updateAcceptanceState(characterId, accepted)
  }

  /**
   * Check if both users have accepted
   * @returns {boolean} True if both users accepted
   */
  const bothUsersAccepted = computed(() => {
    return userAccepted.value && opponentAccepted.value
  })

  /**
   * Check if results can be edited (neither user has accepted)
   * @returns {boolean} True if results can be edited
   */
  const canEditResults = computed(() => {
    return !userAccepted.value && !opponentAccepted.value
  })

  /**
   * Check if should show exit confirmation
   * @returns {boolean} True if confirmation should be shown
   */
  function shouldShowExitConfirmation() {
    return opponent.value && 
           rollResults.value && 
           sessionStatus.value === 'completed' &&
           !bothUsersAccepted.value
  }

  /**
   * Cancel the current session
   */
  function cancelSession() {
    if (sessionId.value) {
      engagementService.cancelSession()
    }
  }

  /**
   * Clean up all event listeners
   */
  function cleanupEventListeners() {
    Object.entries(eventHandlers).forEach(([eventName, handler]) => {
      if (handler) {
        const eventMap = {
          sessionCreated: 'session-created',
          sessionUpdated: 'session-updated',
          userLeft: 'user-left',
          sessionCancelled: 'session-cancelled',
          rollResults: 'roll-results',
          resultIndicatorUpdated: 'result-indicator-updated',
          dieRerolled: 'die-rerolled',
          successAssignmentUpdated: 'success-assignment-updated',
          acceptanceStateUpdated: 'acceptance-state-updated'
        }
        
        const socketEvent = eventMap[eventName]
        if (socketEvent) {
          engagementService.off(socketEvent, handler)
        }
      }
    })
  }

  /**
   * Disconnect from the engagement service
   */
  function disconnect() {
    cleanupEventListeners()
    engagementService.disconnect()
  }

  return {
    // State
    sessionId,
    sessionStatus,
    opponent,
    rollResults,
    userAccepted,
    opponentAccepted,
    
    // Computed
    bothUsersAccepted,
    canEditResults,
    shouldShowExitConfirmation,
    
    // Methods
    initSession,
    registerAdditionalHandlers,
    registerRollResultsHandler,
    updateUserAcceptance,
    cancelSession,
    cleanupEventListeners,
    disconnect
  }
}
