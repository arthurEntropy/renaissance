import { ref, reactive, computed, nextTick } from 'vue'
import EngagementRollService from '@/services/rolls/engagementRollService'
import engagementSessionService from '@/services/sessions/engagementSessionService'
import PlayerSides from '@/constants/playerSides'
import { DICE_ROLL_DURATION } from '@/constants/animationDurations'
import { getDiceFontClass, getDiceFontMaxClass } from '@/utils/diceFontUtils'
import { rollSingleDie } from '@/utils/diceUtils'

/**
 * Composable for managing reroll animations and UI effects
 * Handles rerolling state, hover effects, and stable UI during animations
 */
export function useEngagementDiceAnimations() {
  // Animation state
  const rerollingDice = reactive(new Set())
  const hoverStates = reactive({})
  const isUpdatingResultLocally = ref(false)
  const isRerolling = ref(false)

  // Stable state for reroll animations
  const previousDicePairs = ref([])
  const previousEngagementWinner = ref(null)

  // Computed properties
  const hasRerollingDice = computed(() => {
    return rerollingDice.size > 0
  })

  // Rerolling control functions
  function startRerolling() {
    isRerolling.value = true
  }

  function stopRerolling() {
    isRerolling.value = false
  }

  // Stable value functions for consistent UI during animations
  // We don't want to show the new results until the reroll animation is complete
  function getStableDicePairs(userDice, opponentDice, userCharacterId, opponentCharacterId, calculateDiceComparisons) {
    // If any dice are rerolling, return previous value to maintain stable UI
    if (hasRerollingDice.value && previousDicePairs.value.length > 0) {
      return previousDicePairs.value
    }

    const pairs = calculateDiceComparisons(userDice, opponentDice, userCharacterId, opponentCharacterId, rerollingDice)
    
    // Store current values as previous when not rerolling
    if (!hasRerollingDice.value && pairs.length > 0) {
      previousDicePairs.value = [...pairs] // Deep copy to avoid reference issues
    }

    return pairs
  }

  function getStableEngagementWinner(dicePairs, userDice, opponentDice, determineEngagementWinner) {
    // If any dice are rerolling, return previous value to maintain stable UI
    if (hasRerollingDice.value && previousEngagementWinner.value !== null) {
      return previousEngagementWinner.value
    }

    const winner = determineEngagementWinner(dicePairs, userDice, opponentDice)
    
    // Store current value as previous when not rerolling
    if (!hasRerollingDice.value && winner !== null) {
      previousEngagementWinner.value = winner
    }

    return winner
  }

  // Hover effects
  function showRerollHover(index, show, player = PlayerSides.USER) {
    const key = `${player}-${index}`
    hoverStates[key] = show
  }

  // Core reroll functionality
  function rerollDie(player, index, characterId, sortedDice, rollResults, opponent, clearSuccessAssignment, animationDuration, sessionManager, recalculateResults) {
    // Async because we need to wait for the animation to complete
    return new Promise((resolve) => {
      const rerollKey = `${player}-${index}`

      // Clear any assigned success for this die since it's being re-rolled
      if (clearSuccessAssignment) {
        clearSuccessAssignment(player, index, characterId)
      }

      // Get the target die
      const targetDie = sortedDice[index]
      if (!targetDie) {
        resolve()
        return
      }

      const originalDieSize = targetDie.dieSides

      // Start blocking UI updates during animation
      if (sessionManager?.startRerolling) {
        sessionManager.startRerolling()
      }

      // Mark this die as re-rolling and store previous value for stable comparisons
      rerollingDice.add(rerollKey)
      targetDie.previousValue = targetDie.dieRollValue

      // Show max value while re-rolling
      targetDie.cssClass = getDiceFontMaxClass(originalDieSize)
      targetDie.rolledMaxValue = false

      // Roll new value
      const newValue = rollSingleDie(originalDieSize)
      const isNewMax = newValue === originalDieSize

      // Broadcast the reroll to other players using poolIndex (original array position)
      engagementSessionService.rerollDie(player, targetDie.poolIndex, newValue, characterId)

      // After animation completes, show new result
      setTimeout(() => {
        // Update the die with new result
        targetDie.dieRollValue = newValue
        targetDie.cssClass = getDiceFontClass(originalDieSize, newValue)
        targetDie.rolledMaxValue = isNewMax

        // Update the roll results
        const opponentSocketId = opponent?.socketId
        EngagementRollService.updateRollResultsAfterReroll(
          rollResults,
          player,
          index,
          newValue,
          characterId,
          opponentSocketId,
          sortedDice
        )

        // Force recalculation of dice pair comparisons
        recalculateResults()

        // IMPORTANT: Clean up reroll state AFTER recalculation is complete
        // This ensures stable values are available during the recalculation
        nextTick(() => {
          // Remove from rerolling set and clean up previous value
          rerollingDice.delete(rerollKey)
          delete targetDie.previousValue

          // Stop blocking UI updates - results can now update
          if (sessionManager?.stopRerolling) {
            sessionManager.stopRerolling()
          }
        })

        resolve()
      }, animationDuration)
    })
  }

  function handleRemoteDieReroll(player, originalDiceIndex, newValue, characterId, currentCharacterId, targetDice, rollResults, opponent, animationDuration, sessionManager, recalculateResults) {
    // Don't process our own rerolls
    if (characterId === currentCharacterId) {
      return
    }

    // Find the die by its poolIndex
    const targetDie = targetDice.find(die => die.poolIndex === originalDiceIndex)
    if (!targetDie) {
      return
    }

    // Get the current sorted position for the reroll animation key
    const sortedPosition = targetDice.findIndex(die => die.poolIndex === originalDiceIndex)
    
    // For remote rerolls, always use 'opponent' as the side
    const rerollKey = `${PlayerSides.OPPONENT}-${sortedPosition}`

    // The rerolling state should already be set by the caller, but ensure it's set
    if (!rerollingDice.has(rerollKey)) {
      rerollingDice.add(rerollKey)
      
      // Start blocking UI updates during animation if not already started
      if (sessionManager?.startRerolling) {
        sessionManager.startRerolling()
      }
    }

    // Store previous value for stable comparisons
    targetDie.previousValue = targetDie.dieRollValue

    // Show max value while rerolling
    const originalDieSize = targetDie.dieSides
    targetDie.cssClass = getDiceFontMaxClass(originalDieSize)
    targetDie.rolledMaxValue = false

    // After animation, show new result
    setTimeout(() => {
      const isNewMax = newValue === originalDieSize
      targetDie.dieRollValue = newValue
      targetDie.cssClass = getDiceFontClass(originalDieSize, newValue)
      targetDie.rolledMaxValue = isNewMax

      // Update roll results with sorted position
      EngagementRollService.updateRollResultsAfterReroll(
        rollResults,
        PlayerSides.OPPONENT,
        sortedPosition,
        newValue,
        characterId,
        opponent?.socketId,
        targetDice
      )
      
      // Force recalculation of dice pair comparisons
      recalculateResults()

      // IMPORTANT: Clean up reroll state AFTER recalculation is complete
      // This ensures stable values are available during the recalculation
      nextTick(() => {
        // Remove from rerolling set and clean up previous value
        rerollingDice.delete(rerollKey)
        delete targetDie.previousValue

        // Stop blocking UI updates - results can now update
        if (sessionManager?.stopRerolling) {
          sessionManager.stopRerolling()
        }
      })
    }, animationDuration)
  }

  // UI styling functions
  function getDiceClasses(die, index, side) {
    const classes = []

    if (die.isRolling || isDieRerolling(index, side)) {
      classes.push(`rolling-die-${(index % 3) + 1}`) // Cycle through 3 rolling styles
    } else {
      classes.push('result-die')
    }

    if (die.isMax) {
      classes.push('max-result')
    }

    if (isDieRerolling(index, side)) {
      classes.push('rerolling')
    }

    return classes
  }

  function isDieRerolling(index, side = PlayerSides.USER) {
    return rerollingDice.has(`${side}-${index}`)
  }

  function getColumnClasses(side, isOpponent, showResults, winner) {
    const classes = []

    if (isOpponent) {
      classes.push('opponent-column')
    } else {
      classes.push('user-column')
    }

    if (showResults && winner) {
      if ((winner === 'user' && !isOpponent) || (winner === 'opponent' && isOpponent)) {
        classes.push('winner-column')
      } else if (winner !== 'tie') {
        classes.push('loser-column')
      }
    }

    return classes
  }

  function resetAnimationState() {
    rerollingDice.clear()
    Object.keys(hoverStates).forEach(key => delete hoverStates[key])
    isUpdatingResultLocally.value = false
    previousDicePairs.value = []
    previousEngagementWinner.value = null
  }

  return {
    // State
    rerollingDice,
    hoverStates,
    isUpdatingResultLocally,
    isRerolling,
    previousDicePairs,
    previousEngagementWinner,

    // Constants
    DICE_ROLL_DURATION,

    // Computed
    hasRerollingDice,

    // Control functions
    startRerolling,
    stopRerolling,

    // Stable value functions
    getStableDicePairs,
    getStableEngagementWinner,

    // Animation functions
    showRerollHover,
    rerollDie,
    handleRemoteDieReroll,

    // UI styling
    getDiceClasses,
    isDieRerolling,
    getColumnClasses,

    // Cleanup
    resetAnimationState
  }
}
