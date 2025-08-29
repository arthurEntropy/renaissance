import { ref, reactive, computed } from 'vue'
import { SESSION_STATUS } from '@shared/constants/sessionStatus.js'
import opposedSkillCheckSessionService from '@/services/opposedSkillCheckSessionService'
import OpposedSkillCheckService from '@/services/opposedSkillCheckService'

export function useOpposedSkillCheckSession() {
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
    acceptanceStateUpdated: null
  })

  function initializeSession(character, skillCheckConfig, resultIndicatorCallback, dieRerolledCallback, rollResultsCallback) {
    // Store the skill config for the UI
    userSkillConfig.value = skillCheckConfig
    
    // Connect to the WebSocket if not already connected
    opposedSkillCheckSessionService.connect()
    
    opposedSkillCheckSessionService.autoJoinOrCreate(character, skillCheckConfig)

    // Setup event listeners with the provided callbacks
    setupOpposedSkillCheckListeners(character, resultIndicatorCallback, dieRerolledCallback, rollResultsCallback)
  }

  function setupOpposedSkillCheckListeners(character, resultIndicatorCallback, dieRerolledCallback, rollResultsCallback) {
    // Session created handler
    eventHandlers.sessionCreated = ({ sessionId: newSessionId, session }) => {
      sessionId.value = newSessionId
      sessionStatus.value = session.status
    }

    // Session updated handler
    eventHandlers.sessionUpdated = ({ session }) => {
      console.log('useOpposedSkillCheckSession - Session updated:', session)
      sessionId.value = session.id
      sessionStatus.value = session.status

      // Find opponent (the other user in the session)
      if (session.users && session.users.length === 2) {
        const otherUser = session.users.find(user =>
          user.characterInfo.id !== character.id)

        if (otherUser) {
          opponent.value = otherUser
          console.log('useOpposedSkillCheckSession - Set opponent from session update:', opponent.value)
        }
      }
    }

    // Session cancelled handler
    eventHandlers.sessionCancelled = ({ message, characterName }) => {
      const alertMessage = characterName ? `${characterName} has exited the opposed skill check.` : message
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

    // Roll results handler - creates the opposed skill check result and updates dice results
    eventHandlers.rollResults = ({ session, timestamp }) => {
      console.log('useOpposedSkillCheckSession - Roll results received:', { session, timestamp })
      rollResults.value = { session, timestamp }
      sessionStatus.value = session.status
      
      // Update session state when we get results
      if (session.users && session.users.length === 2) {
        const otherUser = session.users.find(user => user.characterInfo.id !== character.id)
        if (otherUser && !opponent.value) {
          opponent.value = {
            characterInfo: otherUser.characterInfo,
            skillCheckConfig: otherUser.skillCheckConfig,
            socketId: otherUser.socketId
          }
          console.log('useOpposedSkillCheckSession - Set opponent from roll results:', opponent.value)
        }
      }
      
      // Create the opposed skill check result for display
      const opposedResult = OpposedSkillCheckService.createOpposedSkillCheckResult(
        session, 
        character.id, 
        opponent.value?.characterInfo.id
      )
      
      console.log('useOpposedSkillCheckSession - Created opposed result:', opposedResult)
      
      if (opposedResult && rollResultsCallback) {
        rollResultsCallback(opposedResult)
      }
    }

    // Passed-in handlers
    eventHandlers.resultIndicatorUpdated = resultIndicatorCallback
    eventHandlers.dieRerolled = dieRerolledCallback

    // Register all event listeners
    opposedSkillCheckSessionService.on('session-created', eventHandlers.sessionCreated)
    opposedSkillCheckSessionService.on('session-updated', eventHandlers.sessionUpdated)
    opposedSkillCheckSessionService.on('session-cancelled', eventHandlers.sessionCancelled)
    opposedSkillCheckSessionService.on('roll-results', eventHandlers.rollResults)
    opposedSkillCheckSessionService.on('acceptance-state-updated', eventHandlers.acceptanceStateUpdated)
    opposedSkillCheckSessionService.on('result-indicator-updated', eventHandlers.resultIndicatorUpdated)
    opposedSkillCheckSessionService.on('die-rerolled', eventHandlers.dieRerolled)
  }

  function updateUserAcceptance(characterId, accepted) {
    userAccepted.value = accepted
    opposedSkillCheckSessionService.updateAcceptanceState(characterId, accepted)
  }

  const bothUsersAccepted = computed(() => {
    return userAccepted.value && opponentAccepted.value
  })

  const canEditResults = computed(() => {
    // Results can only be edited if neither user has accepted
    return !userAccepted.value && !opponentAccepted.value
  })

  // UI state computed properties
  const shouldShowComparisons = computed(() => {
    return rollResults.value && 
           rollResults.value.session && 
           sessionStatus.value === SESSION_STATUS.COMPLETED && 
           opponent.value
  })

  const shouldShowResolution = computed(() => {
    return opponent.value
  })

  const shouldShowCancelButton = computed(() => {
    return !opponent.value
  })

  const showResults = computed(() => {
    return rollResults.value &&
           rollResults.value.session &&
           sessionStatus.value === SESSION_STATUS.COMPLETED
  })

  const shouldShowExitConfirmation = computed(() => {
    // Only ask for user confirmation before exiting if there's an opponent and dice have already been rolled
    return opponent.value && 
           rollResults.value && 
           sessionStatus.value === SESSION_STATUS.COMPLETED &&
           !bothUsersAccepted.value
  })

  const canCancelSession = computed(() => {
    return sessionId.value && sessionStatus.value !== SESSION_STATUS.COMPLETED
  })

  const userSkillConfig = ref(null)
  const userDice = computed(() => {
    if (!rollResults.value?.session?.users) return []
    const userSession = rollResults.value.session.users.find(u => u.characterInfo.id !== opponent.value?.characterInfo?.id)
    return userSession?.rollResults || []
  })

  const opponentDice = computed(() => {
    if (!rollResults.value?.session?.users || !opponent.value) return []
    const opponentSession = rollResults.value.session.users.find(u => u.characterInfo.id === opponent.value.characterInfo.id)
    return opponentSession?.rollResults || []
  })

  const winner = computed(() => {
    if (!rollResults.value?.session?.users || rollResults.value.session.users.length !== 2) return null
    
    const users = rollResults.value.session.users
    const userTotal = users[0].rollTotal
    const opponentTotal = users[1].rollTotal
    
    if (userTotal > opponentTotal) return 'user'
    if (opponentTotal > userTotal) return 'opponent'
    return 'tie'
  })

  function setUserSkillConfig(config) {
    userSkillConfig.value = config
  }

  function cancelSession() {
    if (sessionId.value) {
      opposedSkillCheckSessionService.cancelSession()
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
          acceptanceStateUpdated: 'acceptance-state-updated'
        }
        
        const socketEvent = eventMap[eventName]
        if (socketEvent) {
          opposedSkillCheckSessionService.off(socketEvent, handler)
        }
      }
    })
  }

  function disconnect() {
    cleanupEventListeners()
    opposedSkillCheckSessionService.disconnect()
  }

  return {
    // State
    sessionId,
    sessionStatus,
    opponent,
    rollResults,
    userAccepted,
    opponentAccepted,
    userSkillConfig,
    
    // Computed
    bothUsersAccepted,
    canEditResults,
    shouldShowComparisons,
    shouldShowResolution,
    shouldShowCancelButton,
    canCancelSession,
    showResults,
    shouldShowExitConfirmation,
    userDice,
    opponentDice,
    winner,
    
    // Methods
    initializeSession,
    setUserSkillConfig,
    updateUserAcceptance,
    cancelSession,
    cleanupEventListeners,
    disconnect
  }
}
