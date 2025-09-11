import { useEngagementDiceState } from './useEngagementDiceState'
import { useEngagementDiceCalculations } from './useEngagementDiceCalculations'
import { useEngagementDiceAnimations } from './useEngagementDiceAnimations'
import { useEngagementDiceEvents } from './useEngagementDiceEvents'

/**
 * Main composable that orchestrates all engagement dice functionality
 * Combines state, calculations, animations, and events into a unified interface
 */
export function useEngagementDice(character = null, allEquipment = null) {
  // Initialize all sub-composables
  const diceState = useEngagementDiceState(character, allEquipment)
  const calculations = useEngagementDiceCalculations(diceState)
  const animations = useEngagementDiceAnimations()
  const events = useEngagementDiceEvents()

  // Enhanced calculations that include animation stability
  const enhancedCalculations = {
    ...calculations,
    getDicePairs: (sessionManager, character, selectedDiceRef) => 
      calculations.getDicePairs(sessionManager, character, selectedDiceRef, animations),
    getEngagementWinner: (sessionManager, character, selectedDiceRef) => 
      calculations.getEngagementWinner(sessionManager, character, selectedDiceRef, animations),
    getWinCounts: (sessionManager, character, selectedDiceRef) => 
      calculations.getWinCounts(sessionManager, character, selectedDiceRef, animations),
    generateColumnProps: (sessionManager, successManager, character, selectedDiceRef, characterSuccesses, allEngagementSuccesses) => 
      calculations.generateColumnProps(sessionManager, successManager, character, selectedDiceRef, characterSuccesses, allEngagementSuccesses, animations)
  }

  // Enhanced animations that include calculation dependencies
  const enhancedAnimations = {
    ...animations,
    getStableDicePairs: animations.getStableDicePairs,
    getStableEngagementWinner: animations.getStableEngagementWinner,
    rerollDie: (player, index, characterId, sortedDice, rollResults, opponent, clearSuccessAssignment, animationDuration, sessionManager) =>
      animations.rerollDie(player, index, characterId, sortedDice, rollResults, opponent, clearSuccessAssignment, animationDuration, sessionManager, () => events.recalculateResults(diceState.manualResults)),
    handleRemoteDieReroll: (player, originalDiceIndex, newValue, characterId, currentCharacterId, targetDice, rollResults, opponent, animationDuration, sessionManager) =>
      animations.handleRemoteDieReroll(player, originalDiceIndex, newValue, characterId, currentCharacterId, targetDice, rollResults, opponent, animationDuration, sessionManager, () => events.recalculateResults(diceState.manualResults))
  }

  // Enhanced events that include all dependencies
  const enhancedEvents = {
    ...events,
    createToggleResultHandler: (sessionManager, character, selectedDiceRef) =>
      events.createToggleResultHandler(sessionManager, character, selectedDiceRef, calculations, diceState.manualResults, animations.isUpdatingResultLocally),
    createRerollDieHandler: (sessionManager, character, selectedDiceRef, successManager) =>
      events.createRerollDieHandler(sessionManager, character, selectedDiceRef, successManager, calculations, enhancedAnimations),
    handleRemoteResultUpdate: (index, state) =>
      events.handleRemoteResultUpdate(index, state, diceState.manualResults, animations.isUpdatingResultLocally),
    recalculateResults: () => events.recalculateResults(diceState.manualResults)
  }

  // Combined reset function
  function resetDiceState() {
    diceState.resetDiceState()
    animations.resetAnimationState()
  }

  return {
    // State from diceState
    manualResults: diceState.manualResults,
    diceStatuses: diceState.diceStatuses,
    
    // State from animations
    rerollingDice: animations.rerollingDice,
    hoverStates: animations.hoverStates,
    isRerolling: animations.isRerolling,
    
    // Constants
    DICE_ROLL_DURATION: animations.DICE_ROLL_DURATION,
    
    // Computed properties - dice data
    equipmentEngagementDice: diceState.equipmentEngagementDice,
    userAddedEngagementDice: diceState.userAddedEngagementDice,
    allOwnedEngagementDice: diceState.allOwnedEngagementDice,
    
    // Computed properties - dice status helpers
    hasSelectedDice: diceState.hasSelectedDice,
    selectedDiceValues: diceState.selectedDiceValues,
    hasExpendedDice: diceState.hasExpendedDice,
    hasRerollingDice: animations.hasRerollingDice,
    
    // Rerolling control
    startRerolling: animations.startRerolling,
    stopRerolling: animations.stopRerolling,
    
    // High-level computations
    getDicePairs: enhancedCalculations.getDicePairs,
    getEngagementWinner: enhancedCalculations.getEngagementWinner,
    getWinCounts: enhancedCalculations.getWinCounts,
    generateColumnProps: enhancedCalculations.generateColumnProps,
    
    // Event handler factories
    createToggleResultHandler: enhancedEvents.createToggleResultHandler,
    createRerollDieHandler: enhancedEvents.createRerollDieHandler,
    
    // Methods - calculations
    getSortedDice: calculations.getSortedDice,
    getSortedUserDice: calculations.getSortedUserDice,
    getSortedOpponentDice: calculations.getSortedOpponentDice,
    getStableDicePairs: enhancedAnimations.getStableDicePairs,
    getStableEngagementWinner: enhancedAnimations.getStableEngagementWinner,
    calculateWinCounts: calculations.calculateWinCounts,
    calculateDiceComparisons: calculations.calculateDiceComparisons,
    determineEngagementWinner: calculations.determineEngagementWinner,
    countWins: calculations.countWins,
    countTies: calculations.countTies,
    
    // Methods - animations
    showRerollHover: animations.showRerollHover,
    rerollDie: enhancedAnimations.rerollDie,
    handleRemoteDieReroll: enhancedAnimations.handleRemoteDieReroll,
    
    // Methods - events
    toggleResult: events.toggleResult,
    handleRemoteResultUpdate: enhancedEvents.handleRemoteResultUpdate,
    recalculateResults: enhancedEvents.recalculateResults,
    
    // Methods - state management
    resetSortingState: diceState.resetSortingState,
    resetDiceState,
    toggleDiceStatus: diceState.toggleDiceStatus,
    resetDice: diceState.resetDice,
    markSelectedDiceAsExpended: diceState.markSelectedDiceAsExpended,
    addUserAddedDie: diceState.addUserAddedDie,
    removeUserAddedDie: diceState.removeUserAddedDie,

    // Methods - dice styling and UI
    getDiceClasses: animations.getDiceClasses,
    isDieRerolling: animations.isDieRerolling,
    getColumnClasses: animations.getColumnClasses
  }
}
