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
import { useCharactersStore } from '@/stores/charactersStore'
import tabletopSocketService from '@/services/sessions/tabletopSocketService'
import { SESSION_STATUS } from '@shared/constants/sessionStatus.js'
import { SESSION_EVENTS } from '@shared/constants/sessionEvents.js'

// Singleton instance
let engagementSessionInstance = null

/**
 * Module-level reactive set of character IDs currently in an active engagement
 * session on this client. Accessible without requiring the singleton to exist.
 */
export const engagedCharacterIds = ref(new Set())

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
  const charactersStore = useCharactersStore()
  
  // Store character for use in event handlers
  const currentCharacter = ref(null)

  // Spectator-mode state
  const isSpectating = ref(false)
  /**
   * When spectating, this overrides the "user" character shown in the modal.
   * Components that need the perspective character (e.g. EngagementCharacterColumn)
   * should prefer this over charactersStore.selectedCharacter.
   */
  const overrideCharacter = ref(null)

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

    // After the session ID becomes available, persist engagement presence to character data
    // so that all clients (and the tabletop) can show the spikes indicator.
    const stopSessionIdWatcher = watch(() => baseSession.sessionId.value, (newSessionId) => {
      if (!newSessionId) return
      // Save to the character object and persist
      character.engagementSessionId = newSessionId
      charactersStore.update(character).catch(() => {})
      // Notify other tabletop clients so they can show the spikes indicator
      tabletopSocketService.broadcastCharacterUpdate(tabletopSocketService.currentTabletopId, character)
      // Update module-level set so the current client sees spikes immediately
      const ids = new Set(engagedCharacterIds.value)
      ids.add(character.id)
      engagedCharacterIds.value = ids
      stopSessionIdWatcher()
    })

    // When session data updates, also track the opponent in the presence set
    watch(() => baseSession.sessionData.value?.users, (users) => {
      if (!users?.length) return
      const ids = new Set(users.map(u => u.characterInfo.id))
      engagedCharacterIds.value = ids
    }, { deep: true })
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
    // Clear engagement presence from character data (only for participants, not spectators)
    if (!isSpectating.value && currentCharacter.value) {
      const char = currentCharacter.value
      if (char.engagementSessionId) {
        delete char.engagementSessionId
        // Best-effort update; ignore errors so disconnect always completes
        charactersStore.update(char).catch(() => {})
        // Notify other tabletop clients so they stop showing the spikes indicator
        tabletopSocketService.broadcastCharacterUpdate(tabletopSocketService.currentTabletopId, char)
      }
    }

    // Reset spectator state
    isSpectating.value = false
    overrideCharacter.value = null
    currentCharacter.value = null

    // Clear module-level engagement presence set
    engagedCharacterIds.value = new Set()

    cleanupEventListeners()
    engagementSessionService.disconnect()
    // Reset singleton instance to null so a fresh instance is created next time
    engagementSessionInstance = null
  }
  
  // Simplified initialize method (public API)
  function initialize(character, selectedDice) {
    const characterSuccessIds = successManager.allOwnedEngagementSuccesses.value.map(s => s.id)
    initializeSession(character, selectedDice, characterSuccessIds)
  }

  /**
   * Join an existing engagement session as a read-only spectator.
   * The UI shows the session from `character`'s perspective.
   * Call cleanup() when the spectate modal closes.
   */
  function spectate(character, sessionId) {
    isSpectating.value = true
    overrideCharacter.value = character
    currentCharacter.value = character
    // Pre-seed the session ID so the store knows which session we're watching
    baseSession.sessionId.value = sessionId

    const callbacks = {
      sessionType: 'engagement',
      onSessionUpdated: ({ session }) => {
        // Populate committedDice from the session data so dice display works for spectators
        const userEntry = session.users?.find(u => u.characterInfo.id === character.id)
        if (userEntry?.selectedDice) {
          diceManager.committedDice.value = userEntry.selectedDice
        }
      },
      onRollResults: ({ session }) => {
        baseSession.rollResults.value = { session }
        baseSession.sessionStatus.value = SESSION_STATUS.COMPLETED
        // Do NOT mark dice as expended – spectators don't own these dice
        diceManager.resetSortingState()
        successManager.resetAssignments()
      },
    }

    baseSession.setupBaseEventHandlers(character, callbacks)

    // Connect and request to join the session room as a spectator
    baseSession.initializeConnection(() => {
      engagementSessionService.spectateSession(sessionId)
    })
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

    // Spectator state
    isSpectating,
    overrideCharacter,
    
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
    spectate,
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
