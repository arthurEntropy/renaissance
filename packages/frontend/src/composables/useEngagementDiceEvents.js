import { nextTick } from 'vue'
import engagementSessionService from '@/services/engagementSessionService'

/**
 * Composable for handling engagement dice events and user interactions
 * Manages event handlers, result toggling, and integration with session management
 */
export function useEngagementDiceEvents() {

  // ResultIndicators toggle logic
  function toggleResult(index, diceComparisons, userCharacterId, opponentCharacterId, manualResults, isUpdatingResultLocally) {
    // Prevent concurrent updates
    if (isUpdatingResultLocally.value) {
      return
    }

    isUpdatingResultLocally.value = true

    try {
      // Initialize manualResults array if needed
      if (!manualResults.value[index]) {
        const pair = diceComparisons[index]
        const newManualResults = [...manualResults.value]
        newManualResults[index] = {
          winnerCharacterId: pair.winnerCharacterId,
          index: pair.index
        }
        manualResults.value = newManualResults
      }

      // Get the current result state
      const result = manualResults.value[index]
      let newState

      // Cycle through states: user win -> tie -> opponent win -> tie -> user win
      if (result.winnerCharacterId === userCharacterId) {
        newState = { winnerCharacterId: null, index }
      } else if (!result.winnerCharacterId) {
        newState = { winnerCharacterId: opponentCharacterId, index }
      } else {
        newState = { winnerCharacterId: userCharacterId, index }
      }

      // Update the manual results
      const newManualResults = [...manualResults.value]
      newManualResults[index] = newState
      manualResults.value = newManualResults

      // Broadcast the change to other players
      engagementSessionService.updateResultIndicator(index, newState)
    } finally {
      isUpdatingResultLocally.value = false
    }
  }

  function handleRemoteResultUpdate(index, state, manualResults, isUpdatingResultLocally) {
    // Prevent infinite loops
    if (isUpdatingResultLocally.value) {
      return
    }

    // Update manual results
    const newManualResults = [...manualResults.value]
    newManualResults[index] = state
    manualResults.value = newManualResults
  }

  function recalculateResults(manualResults) {
    manualResults.value = []
    // Force reactivity update in next tick
    nextTick(() => {
      // Results will be recalculated automatically due to reactivity
    })
  }

  // Event handler factories for component use
  function createToggleResultHandler(sessionManager, character, selectedDiceRef, calculations, manualResults, isUpdatingResultLocally) {
    return (index) => {
      if (!sessionManager.opponent.value) return

      const selectedDice = selectedDiceRef.value || selectedDiceRef
      const userDice = calculations.getSortedUserDice(
        selectedDice,
        sessionManager.sessionData?.value,
        sessionManager.rollResults.value,
        character.id
      )

      const opponentDice = calculations.getSortedOpponentDice(
        sessionManager.opponent.value,
        sessionManager.sessionData?.value,
        sessionManager.rollResults.value,
        character.id
      )

      const diceComparisons = calculations.calculateDiceComparisons(
        userDice,
        opponentDice,
        character.id,
        sessionManager.opponent.value.characterInfo.id,
        new Set() // Not rerolling during toggle
      )

      toggleResult(
        index,
        diceComparisons,
        character.id,
        sessionManager.opponent.value.characterInfo.id,
        manualResults,
        isUpdatingResultLocally
      )
    }
  }

  function createRerollDieHandler(sessionManager, character, selectedDiceRef, successManager, calculations, animations) {
    return async (player, index) => {
      if (!sessionManager.opponent.value) return

      const sortedDice = calculations.getSortedUserDice(
        selectedDiceRef.value || selectedDiceRef, // Handle both ref and direct array
        sessionManager.sessionData?.value,
        sessionManager.rollResults.value,
        character.id
      )

      await animations.rerollDie(
        player,
        index,
        character.id,
        sortedDice,
        sessionManager.rollResults.value,
        sessionManager.opponent.value,
        successManager.clearSuccessAssignment,
        animations.DICE_ROLL_DURATION,
        { startRerolling: animations.startRerolling, stopRerolling: animations.stopRerolling }, // Use our own rerolling functions
        () => recalculateResults(animations.manualResults || { value: [] })
      )
    }
  }

  return {
    // Core event functions
    toggleResult,
    handleRemoteResultUpdate,
    recalculateResults,

    // Event handler factories
    createToggleResultHandler,
    createRerollDieHandler
  }
}
