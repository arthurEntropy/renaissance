import { ref, reactive, computed } from 'vue'
import { SESSION_STATUS } from '@shared/constants/sessionStatus.js'
import engagementSessionService from '@/services/engagementSessionService'

export function useEngagementSession() {
  const sessionId = ref(null)
  const sessionStatus = ref(SESSION_STATUS.WAITING)
  const opponent = ref(null)
  const rollResults = ref(null)
  const userAccepted = ref(false)
  const opponentAccepted = ref(false)

  const eventHandlers = reactive({
    sessionCreated: null,
    sessionUpdated: null,
    sessionCancelled: null,
    rollResults: null,
    resultIndicatorUpdated: null,
    dieRerolled: null,
    successAssignmentUpdated: null,
    acceptanceStateUpdated: null
  })

  function initializeSession(character, selectedDice, characterSuccessIds, resultIndicatorCallback, dieRerolledCallback, successAssignmentCallback, rollResultsCallback) {
    // Connect to the WebSocket if not already connected
    engagementSessionService.connect()
    
    engagementSessionService.autoJoinOrCreate(character, selectedDice, characterSuccessIds)

    // Setup event listeners with the provided callbacks
    setupEngagementListeners(character, resultIndicatorCallback, dieRerolledCallback, successAssignmentCallback, rollResultsCallback)
  }

  function setupEngagementListeners(character, diceComparisonIndicatorHandler, dieRerolledHandler, successAssignmentUpdatedHandler, rollResultsHandler) {
    // Session created handler
    eventHandlers.sessionCreated = ({ sessionId: newSessionId, session }) => {
      sessionId.value = newSessionId
      sessionStatus.value = session.status
    }

    // Session updated handler
    eventHandlers.sessionUpdated = ({ session }) => {
      sessionId.value = session.id
      sessionStatus.value = session.status

      // Find opponent (the other user in the session)
      if (session.users && session.users.length === 2) {
        const otherUser = session.users.find(user =>
          user.characterInfo.id !== character.id)

        if (otherUser) {
          opponent.value = otherUser
        }
      }
    }

    // Session cancelled handler
    eventHandlers.sessionCancelled = ({ message, characterName }) => {
      const alertMessage = characterName ? `${characterName} has exited the engagement.` : message
      alert(alertMessage)
      sessionId.value = null
      sessionStatus.value = SESSION_STATUS.WAITING
      opponent.value = null
    }

    // Acceptance state updated handler
    eventHandlers.acceptanceStateUpdated = ({ characterId, accepted }) => {
      // Don't process our own acceptance state updates because we handle those directly in the component
      if (characterId === character.id) {
        return
      }

      // Update opponent's acceptance state
      if (opponent.value && characterId === opponent.value.characterInfo.id) {
        opponentAccepted.value = accepted
      }
    }

    // Passed-in handlers
    eventHandlers.rollResults = rollResultsHandler
    eventHandlers.resultIndicatorUpdated = diceComparisonIndicatorHandler
    eventHandlers.dieRerolled = dieRerolledHandler
    eventHandlers.successAssignmentUpdated = successAssignmentUpdatedHandler

    // Register all event listeners
    engagementSessionService.on('session-created', eventHandlers.sessionCreated)
    engagementSessionService.on('session-updated', eventHandlers.sessionUpdated)
    engagementSessionService.on('session-cancelled', eventHandlers.sessionCancelled)
    engagementSessionService.on('roll-results', eventHandlers.rollResults)
    engagementSessionService.on('acceptance-state-updated', eventHandlers.acceptanceStateUpdated)
    engagementSessionService.on('result-indicator-updated', eventHandlers.resultIndicatorUpdated)
    engagementSessionService.on('die-rerolled', eventHandlers.dieRerolled)
    engagementSessionService.on('success-assignment-updated', eventHandlers.successAssignmentUpdated)
  }

  function updateUserAcceptance(characterId, accepted) {
    userAccepted.value = accepted
    engagementSessionService.updateAcceptanceState(characterId, accepted)
  }

  const bothUsersAccepted = computed(() => {
    return userAccepted.value && opponentAccepted.value
  })

  const canEditResults = computed(() => {
    // Results can only be edited if neither user has accepted
    return !userAccepted.value && !opponentAccepted.value
  })

  function shouldShowExitConfirmation() {
    // Only ask for user confirmation before exiting if there's an opponent and dice have already been rolled
    return opponent.value && 
           rollResults.value && 
           sessionStatus.value === SESSION_STATUS.COMPLETED &&
           !bothUsersAccepted.value
  }

  function cancelSession() {
    if (sessionId.value) {
      engagementSessionService.cancelSession()
    }
  }

  function cleanupEventListeners() {
    Object.entries(eventHandlers).forEach(([eventName, handler]) => {
      if (handler) {
        const eventMap = {
          sessionCreated: 'session-created',
          sessionUpdated: 'session-updated',
          sessionCancelled: 'session-cancelled',
          rollResults: 'roll-results',
          resultIndicatorUpdated: 'result-indicator-updated',
          dieRerolled: 'die-rerolled',
          successAssignmentUpdated: 'success-assignment-updated',
          acceptanceStateUpdated: 'acceptance-state-updated'
        }
        
        const socketEvent = eventMap[eventName]
        if (socketEvent) {
          engagementSessionService.off(socketEvent, handler)
        }
      }
    })
  }

  function disconnect() {
    cleanupEventListeners()
    engagementSessionService.disconnect()
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
    initializeSession,
    updateUserAcceptance,
    cancelSession,
    cleanupEventListeners,
    disconnect
  }
}
