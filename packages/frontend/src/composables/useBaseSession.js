import { ref, computed } from 'vue'
import { SESSION_STATUS } from '@shared/constants/sessionStatus.js'

/**
 * Base composable for session management that provides common state,
 * event handling, and session lifecycle functionality.
 */
export function useBaseSession(sessionService) {
  // Core session state
  const sessionId = ref(null)
  const sessionStatus = ref(SESSION_STATUS.WAITING)
  const sessionData = ref(null)
  const opponent = ref(null)
  const rollResults = ref(null)
  const userAccepted = ref(false)
  const opponentAccepted = ref(false)

  // Computed properties
  const bothUsersAccepted = computed(() => 
    userAccepted.value && opponentAccepted.value
  )

  const canEditResults = computed(() => 
    sessionStatus.value === SESSION_STATUS.COMPLETED && !bothUsersAccepted.value
  )

  const shouldShowComparisons = computed(() => 
    opponent.value && sessionData.value
  )

  const shouldShowResolution = computed(() => 
    opponent.value !== null
  )

  const shouldShowCancelButton = computed(() => 
    !opponent.value
  )

  const showResults = computed(() => 
    sessionStatus.value === SESSION_STATUS.COMPLETED
  )

  const shouldShowExitConfirmation = computed(() => 
    sessionStatus.value === SESSION_STATUS.COMPLETED && !bothUsersAccepted.value
  )

  // Event handlers
  const eventHandlers = {}

  // Common session management methods
  function setupBaseEventHandlers(character, callbacks = {}) {
    // Session created handler
    eventHandlers.sessionCreated = ({ sessionId: newSessionId, session }) => {
      sessionId.value = newSessionId
      sessionStatus.value = session.status
      if (callbacks.onSessionCreated) {
        callbacks.onSessionCreated({ sessionId: newSessionId, session })
      }
    }

    // Session updated handler
    eventHandlers.sessionUpdated = ({ session }) => {
      sessionId.value = session.id
      sessionStatus.value = session.status
      sessionData.value = session

      // Find opponent (the other user in the session)
      if (session.users && session.users.length === 2) {
        const otherUser = session.users.find(user =>
          user.characterInfo.id !== character.id)

        if (otherUser) {
          opponent.value = otherUser
        }
      }

      if (callbacks.onSessionUpdated) {
        callbacks.onSessionUpdated({ session })
      }
    }

    // Session cancelled handler
    eventHandlers.sessionCancelled = ({ message, characterName }) => {
      const sessionType = callbacks.sessionType || 'session'
      const alertMessage = characterName 
        ? `${characterName} has exited the ${sessionType}.` 
        : message
      alert(alertMessage)
      sessionId.value = null
      sessionStatus.value = SESSION_STATUS.WAITING
      opponent.value = null

      if (callbacks.onSessionCancelled) {
        callbacks.onSessionCancelled({ message, characterName })
      }
    }

    // Acceptance state updated handler
    eventHandlers.acceptanceStateUpdated = ({ characterId, accepted }) => {
      // Don't process our own acceptance state updates
      if (characterId === character.id) {
        return
      }

      opponentAccepted.value = accepted

      if (callbacks.onAcceptanceStateUpdated) {
        callbacks.onAcceptanceStateUpdated({ characterId, accepted })
      }
    }

    // Roll results handler
    eventHandlers.rollResults = ({ session, timestamp }) => {
      // Structure the data as expected by UI components
      rollResults.value = { session }
      sessionStatus.value = session.status

      if (callbacks.onRollResults) {
        callbacks.onRollResults({ session, timestamp })
      }
    }

    // Result indicator updated handler
    if (callbacks.onResultIndicatorUpdated) {
      eventHandlers.resultIndicatorUpdated = callbacks.onResultIndicatorUpdated
    }

    // Die rerolled handler
    if (callbacks.onDieRerolled) {
      eventHandlers.dieRerolled = callbacks.onDieRerolled
    }

    // Register all event handlers with the service
    Object.entries(eventHandlers).forEach(([eventName, handler]) => {
      if (handler) {
        const socketEvent = getSocketEventName(eventName)
        sessionService.on(socketEvent, handler)
      }
    })
  }

  function getSocketEventName(eventName) {
    const eventMap = {
      sessionCreated: 'session-created',
      sessionUpdated: 'session-updated',
      sessionCancelled: 'session-cancelled',
      rollResults: 'roll-results',
      resultIndicatorUpdated: 'result-indicator-updated',
      dieRerolled: 'die-rerolled',
      acceptanceStateUpdated: 'acceptance-state-updated'
    }
    return eventMap[eventName] || eventName
  }

  function initializeConnection(autoJoinCallback) {
    // Connect to the WebSocket if not already connected
    if (sessionService.isConnected()) {
      // Already connected, join immediately
      autoJoinCallback()
    } else {
      // Not connected yet, wait for connection
      sessionService.connect()
      
      // Listen for connection success and then join
      const connectionHandler = ({ connected }) => {
        if (connected) {
          autoJoinCallback()
          // Remove the listener after successful join attempt
          sessionService.off('connection-status', connectionHandler)
        }
      }
      
      sessionService.on('connection-status', connectionHandler)
    }
  }

  function updateUserAcceptance(characterId, accepted) {
    userAccepted.value = accepted
    sessionService.updateAcceptanceState(characterId, accepted)
  }

  function cancelSession() {
    sessionService.cancelSession()
  }

  function cleanupEventListeners() {
    Object.entries(eventHandlers).forEach(([eventName, handler]) => {
      if (handler) {
        const socketEvent = getSocketEventName(eventName)
        sessionService.off(socketEvent, handler)
      }
    })

    // Clear handlers
    Object.keys(eventHandlers).forEach(key => {
      eventHandlers[key] = null
    })
  }

  function disconnect() {
    cleanupEventListeners()
    sessionService.disconnect()
  }

  function resetAcceptanceState() {
    userAccepted.value = false
    opponentAccepted.value = false
  }

  return {
    // State
    sessionId,
    sessionStatus,
    sessionData,
    opponent,
    rollResults,
    userAccepted,
    opponentAccepted,
    eventHandlers,

    // Computed
    bothUsersAccepted,
    canEditResults,
    shouldShowComparisons,
    shouldShowResolution,
    shouldShowCancelButton,
    showResults,
    shouldShowExitConfirmation,

    // Methods
    setupBaseEventHandlers,
    initializeConnection,
    updateUserAcceptance,
    cancelSession,
    cleanupEventListeners,
    disconnect,
    resetAcceptanceState
  }
}
