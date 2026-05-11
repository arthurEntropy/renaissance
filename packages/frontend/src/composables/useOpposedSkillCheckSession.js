import { ref, computed, watch } from 'vue'
import { SESSION_STATUS } from '@shared/constants/sessionStatus.js'
import { SESSION_EVENTS } from '@shared/constants/sessionEvents.js'
import { WINNER } from '@shared/constants/winner.js'
import { PlayerSides } from '@/constants/playerSides.js'
import { DICE_ROLL_DURATION } from '@/constants/animationDurations'
import opposedSkillCheckSessionService from '@/services/sessions/opposedSkillCheckSessionService'
import OpposedSkillCheckService from '@/services/rolls/opposedSkillCheckService'
import { useBaseSession } from './useBaseSession.js'
import { useRollsStore } from '@/stores/rollsStore'

let opposedSkillCheckSessionInstance = null

export function useOpposedSkillCheckSession() {
  // Return existing instance if already created
  if (opposedSkillCheckSessionInstance) {
    return opposedSkillCheckSessionInstance
  }

  const baseSession = useBaseSession(opposedSkillCheckSessionService)
  
  const rollsStore = useRollsStore()

  // Simple rerolling state to block UI updates during animations
  const isRerolling = ref(false)
  const rerollingCharacterId = ref(null)

  // Create a ref for animation trigger callbacks - this allows the modal to register animation triggers
  const animationTriggers = ref({
    user: null,
    opponent: null
  })

  function setAnimationTrigger(side, triggerFunction) {
    if (typeof triggerFunction !== 'function') {
      return
    }
    animationTriggers.value[side] = triggerFunction
  }

  function startRerolling(characterId = null) {
    isRerolling.value = true
    // Ensure characterId is converted to string for consistent prop typing
    rerollingCharacterId.value = characterId !== null ? String(characterId) : null
  }

  function stopRerolling() {
    isRerolling.value = false
    rerollingCharacterId.value = null
  }

  // Opposed skill check specific state
  const currentCharacter = ref(null)
  const currentDiceManager = ref(null)
  const userSkillConfig = ref(null)
  const sendToDiscord = ref(true)

  // Signals the modal to close when opponent leaves after both accepted
  const opponentLeftAfterBothAccepted = ref(false)

  // Store previous winner for stable display during reroll animations
  const previousWinner = ref(null)

  // Opposed skill check specific computed properties
  const canCancelSession = computed(() => {
    return baseSession.sessionStatus.value !== SESSION_STATUS.COMPLETED || 
           !baseSession.bothUsersAccepted.value
  })

  const userDice = computed(() => {
    if (!baseSession.rollResults.value || !currentCharacter.value) return []
    
    const currentUser = baseSession.rollResults.value.users?.find(user => 
      user.characterInfo.id === currentCharacter.value.id
    )
    return currentUser?.rollResults || []
  })

  const opponentDice = computed(() => {
    if (!baseSession.rollResults.value || !baseSession.opponent.value) return []
    
    const opponentUser = baseSession.rollResults.value.users?.find(user => 
      user.characterInfo.id === baseSession.opponent.value.characterInfo.id
    )
    return opponentUser?.rollResults || []
  })

  const winner = computed(() => {
    if (!baseSession.rollResults.value || !currentCharacter.value) return null
    
    // If rerolling, return previous value to maintain stable UI
    if (isRerolling.value && previousWinner.value !== null) {
      return previousWinner.value
    }
    
    const rollResults = baseSession.rollResults.value
    const session = rollResults.session // Access the nested session object
    
    if (!session) return null
    
    // Handle tie case
    if (session.winner === -1) return WINNER.TIE
    
    // Handle no winner determined yet
    if (session.winner === null || session.winner === undefined) return null
    
    // Determine if the winner is the current user or opponent
    const winnerUser = session.users?.[session.winner]
    if (!winnerUser) return null
    
    return winnerUser.characterInfo.id === currentCharacter.value.id ? WINNER.USER : WINNER.OPPONENT
  })

  // Watch for changes in winner to store previous values
  watch(winner, (newWinner) => {
    if (!isRerolling.value && newWinner !== null) {
      previousWinner.value = newWinner
    }
  })

  function initializeSession(character, skillCheckConfig, options = {}, _resultIndicatorCallback, _dieRerolledCallback, _rollResultsCallback) {
    // Reset acceptance state for fresh session
    baseSession.resetAcceptanceState()
    
    // Store the character and skill config for use in computed properties
    currentCharacter.value = character
    userSkillConfig.value = skillCheckConfig
    sendToDiscord.value = options.sendToDiscord !== false
    
    // Setup event listeners - all handled internally now
    const callbacks = {
      sessionType: 'opposed skill check',
      onRollResults: ({ session, _timestamp }) => {
        // Ensure session has the expected structure
        if (!session || !session.users || session.users.length < 2) {
          console.error('Invalid session structure for opposed skill check:', session)
          return
        }
        
        // Find the opponent in the session
        const opponent = session.users.find(user => user.characterInfo.id !== character.id)
        
        if (!opponent) {
          console.error('Could not find opponent in session:', session.users)
          return
        }
        
        // Create the opposed result for Discord webhook
        const opposedResult = OpposedSkillCheckService.createOpposedSkillCheckResult(
          session,
          character.id,
          opponent.characterInfo.id
        )
        
        // Send to Discord if result was created
        if (opposedResult) {
          // Discord webhook is handled by the service internally
        } else {
          console.error('Failed to create opposed skill check result')
        }
      },
      onAcceptanceStateUpdated: ({ _characterId, accepted }) => {
        // When opponent accepts, check if both users have now accepted
        // This ensures the first user to accept also gets results when the second user accepts
        if (accepted && baseSession.userAccepted.value && baseSession.opponentAccepted.value) {
          generateResultsOnAccept()
        }
      },
      onSessionCancelled: ({ wasCompleted }) => {
        if (wasCompleted) {
          opponentLeftAfterBothAccepted.value = true
        }
      }
    }

    baseSession.setupBaseEventHandlers(character, callbacks)

    // Setup opposed skill check specific event handlers
    setupOpposedSkillCheckSpecificHandlers()
    
    // Initialize connection and auto-join
    baseSession.initializeConnection(() => {
      opposedSkillCheckSessionService.autoJoinOrCreate(character, skillCheckConfig)
    })
  }

  function setupOpposedSkillCheckSpecificHandlers() {
    // Watch for session status changes to trigger rolling
    watch(() => baseSession.sessionStatus.value, (newStatus, oldStatus) => {
      // When session becomes ACTIVE and we haven't rolled yet, start rolling
      if (newStatus === SESSION_STATUS.ACTIVE && oldStatus === SESSION_STATUS.WAITING) {
        // Make a skill check for the current character
        const rollResult = OpposedSkillCheckService.makeOpposedSkillCheck(userSkillConfig.value, currentCharacter.value)
        
        // Wait for roll animation duration before submitting results
        setTimeout(() => {
          opposedSkillCheckSessionService.submitRollResults(rollResult, currentCharacter.value.id)
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
            winner = 0 // user is index 0
          } else if (users[1].rollTotal > users[0].rollTotal) {
            winner = 1 // opponent is index 1
          } else {
            winner = -1 // tie
          }
          
          // Complete the session with the calculated winner
          opposedSkillCheckSessionService.completeSession(winner)
        }
      }
    }, { deep: true, immediate: true })

    // Start reroll handler  
    const startRerollHandler = ({ rerollingCharacterId }) => {
      // Start blocking UI updates during reroll animation, tracking who is rerolling
      startRerolling(rerollingCharacterId)
      
      // Trigger animation based on which character is rerolling
      // This ensures animations play in both players' views
      // Convert IDs to strings for consistent comparison
      const rerollingIdStr = String(rerollingCharacterId)
      const currentUserIdStr = String(currentCharacter.value?.id)
      const opponentIdStr = String(baseSession.opponent.value?.characterInfo?.id)
      
      if (rerollingIdStr === currentUserIdStr) {
        // Current user is rerolling - trigger user animation
        if (animationTriggers.value.user) {
          animationTriggers.value.user()
        }
      } else if (rerollingIdStr === opponentIdStr) {
        // Opponent is rerolling - trigger opponent animation
        if (animationTriggers.value.opponent) {
          animationTriggers.value.opponent()
        }
      }
      
      // Only perform the actual reroll if this is the character that initiated it
      if (rerollingIdStr === currentUserIdStr) {
        const rollResult = OpposedSkillCheckService.makeOpposedSkillCheck(userSkillConfig.value, currentCharacter.value)
        opposedSkillCheckSessionService.submitRollResults(rollResult, currentCharacter.value.id)
      }
      
      // Stop blocking UI updates after animation duration
      setTimeout(() => {
        stopRerolling()
      }, DICE_ROLL_DURATION)
    }

    // Register the handlers
    opposedSkillCheckSessionService.on(SESSION_EVENTS.START_REROLL, startRerollHandler)

    // Store handlers for cleanup
    baseSession.eventHandlers.startReroll = startRerollHandler
  }

  function setUserSkillConfig(config) {
    userSkillConfig.value = config
  }

  function rerollAllDice(side, diceManager = null) {
    if (!baseSession.sessionId.value || !currentCharacter.value) {
      console.warn('Cannot reroll - no active session or character')
      return
    }
    
    // Store the dice manager reference for use in event handlers (if provided)
    if (diceManager) {
      currentDiceManager.value = diceManager
    }
    
    // Determine which character is rerolling
    const rerollingCharacterId = side === PlayerSides.USER 
      ? currentCharacter.value?.id 
      : baseSession.opponent.value?.characterInfo?.id

    if (!rerollingCharacterId) {
      console.warn('Cannot determine rerolling character ID for side:', side)
      return
    }

    // Simply trigger the reroll - all animation logic will be handled by the event handler
    opposedSkillCheckSessionService.rerollSkillCheck(baseSession.sessionId.value, rerollingCharacterId)
  }

  function cleanupEventListeners() {
    // Clean up base event listeners
    baseSession.cleanupEventListeners()

    // Clean up opposed skill check specific handlers
    if (baseSession.eventHandlers.startReroll) {
      opposedSkillCheckSessionService.off(SESSION_EVENTS.START_REROLL, baseSession.eventHandlers.startReroll)
    }
  }

  function disconnect() {
    cleanupEventListeners()
    opposedSkillCheckSessionService.disconnect()
    opponentLeftAfterBothAccepted.value = false
    // Reset singleton instance to null so a fresh instance is created next time
    opposedSkillCheckSessionInstance = null
  }
  
  // Simplified public API methods
  function initialize(character, skillCheckConfig, options = {}) {
    initializeSession(character, skillCheckConfig, options)
  }
  
  function cleanup() {
    disconnect()
  }
  
  // Alias for backwards compatibility
  function startSession(character, skillCheckConfig, options = {}) {
    initialize(character, skillCheckConfig, options)
  }
  
  // Generate results when both users accept
  function generateResultsOnAccept() {
    if (!baseSession.bothUsersAccepted.value) {
      return null
    }
    
    // Create and emit results via service
    const result = OpposedSkillCheckService.emitOpposedSkillCheckResult(
      baseSession.rollResults.value.session,
      currentCharacter.value?.id,
      baseSession.opponent.value?.characterInfo?.id,
      { sendToDiscord: sendToDiscord.value }
    )
    
    // Store result in rollsStore to display in DiceBox
    if (result) {
      rollsStore.setRoll(result)
    }
    
    return result
  }

  // Create the return object
  const returnObject = {
    // State from base
    sessionId: baseSession.sessionId,
    sessionStatus: baseSession.sessionStatus,
    opponent: baseSession.opponent,
    rollResults: baseSession.rollResults,
    userAccepted: baseSession.userAccepted,
    opponentAccepted: baseSession.opponentAccepted,
    
    // Specific state
    userSkillConfig,
    opponentLeftAfterBothAccepted,
    
    // Computed from base
    bothUsersAccepted: baseSession.bothUsersAccepted,
    canEditResults: baseSession.canEditResults,
    shouldShowComparisons: baseSession.shouldShowComparisons,
    shouldShowResolution: baseSession.shouldShowResolution,
    shouldShowCancelButton: baseSession.shouldShowCancelButton,
    showResults: baseSession.showResults,
    shouldShowExitConfirmation: baseSession.shouldShowExitConfirmation,
    
    // Specific computed
    canCancelSession,
    userDice,
    opponentDice,
    winner,
    
    // Methods from base
    updateUserAcceptance: baseSession.updateUserAcceptance,
    cancelSession: baseSession.cancelSession,
    resetAcceptanceState: baseSession.resetAcceptanceState,
    
    // Rerolling state and methods
    isRerolling,
    rerollingCharacterId,
    startRerolling,
    stopRerolling,
    setAnimationTrigger,
    
    // Specific methods
    initializeSession,
    setUserSkillConfig,
    cleanupEventListeners,
    disconnect,
    rerollAllDice,
    
    // Public API methods
    initialize,
    cleanup,
    startSession, // Alias for compatibility
    generateResultsOnAccept
  }

  // Store and return singleton instance
  opposedSkillCheckSessionInstance = returnObject
  return returnObject
}
