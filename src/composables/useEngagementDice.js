import { ref, reactive, nextTick } from 'vue'
import DiceService from '@/services/DiceService'
import engagementService from '@/services/EngagementService'

/**
 * Composable for managing engagement dice state and reroll logic
 */
export function useEngagementDice() {
  // Dice state
  const manualResults = ref([])
  const rerollingDice = reactive(new Set())
  const hoverStates = reactive({})
  const isUpdatingResultLocally = ref(false)
  
  // Sorting state
  const initialSortDone = ref(false)
  const sortedOrder = ref(null)
  const opponentInitialSortDone = ref(false)
  const opponentSortedOrder = ref(null)

  /**
   * Get sorted dice for display
   * @param {Array} selectedDice - Array of dice values
   * @param {Object} rollResults - Roll results object
   * @param {string} characterId - Character ID
   * @param {string} side - 'user' or 'opponent'
   * @param {Object} opponent - Opponent object (for opponent side)
   * @returns {Array} Sorted dice array
   */
  function getSortedDice(selectedDice, rollResults, characterId, side = 'user', opponent = null) {
    // Check if selectedDice is empty or not an array
    if (!selectedDice || !Array.isArray(selectedDice) || selectedDice.length === 0) {
      return []
    }

    // If we have roll results, use those values
    if (rollResults && rollResults.session) {
      let targetResults
      
      if (side === 'user') {
        targetResults = rollResults.session.users.find(user => user.characterInfo.id === characterId)
      } else {
        targetResults = rollResults.session.users.find(user => user.socketId === opponent?.socketId)
      }

      if (targetResults && targetResults.rollResults) {
        // Use DiceService to sort the dice
        const sortedDice = DiceService.sortEngagementDice(selectedDice, targetResults.rollResults)
        
        // Store sorted order for consistency
        if (side === 'user' && !initialSortDone.value) {
          sortedOrder.value = sortedDice
          initialSortDone.value = true
        } else if (side === 'opponent' && !opponentInitialSortDone.value) {
          opponentSortedOrder.value = sortedDice
          opponentInitialSortDone.value = true
        }

        // Return existing sorted order with updated values, or the newly sorted dice
        const existingOrder = side === 'user' ? sortedOrder.value : opponentSortedOrder.value
        if (existingOrder) {
          // Update existing order with new values
          existingOrder.forEach((sortedDie) => {
            const originalDie = sortedDice.find(d => d.originalIndex === sortedDie.originalIndex)
            if (originalDie) {
              sortedDie.value = originalDie.value
              sortedDie.class = originalDie.class
              sortedDie.isMax = originalDie.isMax
              sortedDie.isRolling = originalDie.isRolling
            }
          })
          return existingOrder
        }

        return sortedDice
      }
    }

    // No results yet - show dice in rolling state
    return DiceService.sortEngagementDice(selectedDice, null)
  }

  /**
   * Calculate dice comparisons using DiceService
   * @param {Array} userDice - User's sorted dice
   * @param {Array} opponentDice - Opponent's sorted dice
   * @param {string} userCharacterId - User's character ID
   * @param {string} opponentCharacterId - Opponent's character ID
   * @returns {Array} Dice comparisons array
   */
  function calculateDiceComparisons(userDice, opponentDice, userCharacterId, opponentCharacterId) {
    return DiceService.calculateDiceComparisons(
      userDice, 
      opponentDice, 
      userCharacterId, 
      opponentCharacterId, 
      manualResults.value
    )
  }

  /**
   * Determine engagement winner using DiceService
   * @param {Array} diceComparisons - Dice comparisons array
   * @param {Array} userDice - User's dice array
   * @param {Array} opponentDice - Opponent's dice array
   * @returns {string|null} Winner designation
   */
  function determineEngagementWinner(diceComparisons, userDice, opponentDice) {
    return DiceService.determineEngagementWinner(diceComparisons, userDice, opponentDice)
  }

  /**
   * Count wins for a specific side
   * @param {Array} diceComparisons - Dice comparisons array
   * @param {string} side - 'user' or 'opponent'
   * @param {string} userCharacterId - User's character ID
   * @param {string} opponentCharacterId - Opponent's character ID
   * @returns {number} Number of wins
   */
  function countWins(diceComparisons, side, userCharacterId, opponentCharacterId) {
    return DiceService.countSideWins(diceComparisons, side, userCharacterId, opponentCharacterId)
  }

  /**
   * Count ties in dice comparisons
   * @param {Array} diceComparisons - Dice comparisons array
   * @returns {number} Number of ties
   */
  function countTies(diceComparisons) {
    return DiceService.countTies(diceComparisons)
  }

  /**
   * Handle reroll hover state
   * @param {number} index - Die index
   * @param {boolean} show - Whether to show hover
   * @param {string} player - 'user' or 'opponent'
   */
  function showRerollHover(index, show, player = 'user') {
    const key = `${player}-${index}`
    hoverStates[key] = show
  }

  /**
   * Reroll a die
   * @param {string} player - 'user' or 'opponent'
   * @param {number} index - Die index in sorted array
   * @param {string} characterId - Character ID
   * @param {Array} sortedDice - Current sorted dice array
   * @param {Object} rollResults - Current roll results
   * @param {Object} opponent - Opponent object (for updating opponent results)
   * @param {Function} clearSuccessAssignment - Function to clear success assignments
   * @returns {Promise} Promise that resolves when reroll is complete
   */
  function rerollDie(player, index, characterId, sortedDice, rollResults, opponent, clearSuccessAssignment) {
    return new Promise((resolve) => {
      const rerollKey = `${player}-${index}`

      // Clear any assigned success for this die since it's being rerolled
      if (clearSuccessAssignment) {
        clearSuccessAssignment(player, index, characterId)
      }

      // Mark this die as rerolling
      rerollingDice.add(rerollKey)

      // Get the target die
      const targetDice = sortedDice[index]
      if (!targetDice) {
        resolve()
        return
      }

      const originalDieSize = targetDice.die

      // Show max value while rerolling
      targetDice.class = `df-d${originalDieSize}-${originalDieSize}`
      targetDice.isMax = false

      // Roll new value using DiceService
      const newValue = DiceService.rollSingleDie(originalDieSize)
      const isNewMax = newValue === originalDieSize

      // Broadcast the reroll to other users immediately
      engagementService.rerollDie(player, index, newValue, characterId)

      // After animation completes, show new result
      setTimeout(() => {
        // Update the die with new result
        targetDice.value = newValue
        targetDice.class = `df-d${originalDieSize}-${newValue}`
        targetDice.isMax = isNewMax

        // Remove from rerolling set
        rerollingDice.delete(rerollKey)

        // Update the roll results using DiceService
        const opponentSocketId = opponent?.socketId
        DiceService.updateRollResultsAfterReroll(
          rollResults,
          player,
          index,
          newValue,
          characterId,
          opponentSocketId,
          sortedDice
        )

        // Clear manual results and recalculate
        recalculateComparisons()

        resolve()
      }, 1500)
    })
  }

  /**
   * Handle remote die reroll from opponent
   * @param {string} player - Original player designation
   * @param {number} diceIndex - Die index
   * @param {number} newValue - New die value
   * @param {string} characterId - Character ID of the rerolling player
   * @param {string} currentCharacterId - Current user's character ID
   * @param {Array} targetDice - Target dice array to update
   * @param {Object} rollResults - Roll results to update
   * @param {Object} opponent - Opponent object
   */
  function handleRemoteDieReroll(player, diceIndex, newValue, characterId, currentCharacterId, targetDice, rollResults, opponent) {
    // Don't process our own rerolls
    if (characterId === currentCharacterId) {
      return
    }

    const targetDie = targetDice[diceIndex]
    if (!targetDie) return

    // Show reroll animation
    rerollingDice.add(`opponent-${diceIndex}`)

    // Show max value while rerolling
    const originalDieSize = targetDie.die
    targetDie.class = `df-d${originalDieSize}-${originalDieSize}`
    targetDie.isMax = false

    // After animation, show new result
    setTimeout(() => {
      const isNewMax = newValue === originalDieSize
      targetDie.value = newValue
      targetDie.class = `df-d${originalDieSize}-${newValue}`
      targetDie.isMax = isNewMax

      // Remove from rerolling set
      rerollingDice.delete(`opponent-${diceIndex}`)

      // Update roll results using DiceService
      DiceService.updateRollResultsAfterReroll(
        rollResults,
        'opponent',
        diceIndex,
        newValue,
        characterId,
        opponent?.socketId,
        targetDice
      )

      // Recalculate comparisons
      recalculateComparisons()
    }, 1500)
  }

  /**
   * Toggle manual result for a dice pair
   * @param {number} index - Comparison index
   * @param {Array} diceComparisons - Current dice comparisons
   * @param {string} userCharacterId - User's character ID
   * @param {string} opponentCharacterId - Opponent's character ID
   */
  function toggleResult(index, diceComparisons, userCharacterId, opponentCharacterId) {
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
        // Change from user win to tie
        newState = {
          winnerCharacterId: null,
          index: result.index,
          wasOpponentWin: false
        }
      } else if (!result.winnerCharacterId) {
        // Currently tied - check if we were cycling from user or opponent
        if (!result.wasOpponentWin) {
          // Go to opponent win
          newState = {
            winnerCharacterId: opponentCharacterId,
            index: result.index,
            wasOpponentWin: true
          }
        } else {
          // Go back to user win
          newState = {
            winnerCharacterId: userCharacterId,
            index: result.index
          }
        }
      } else if (result.winnerCharacterId === opponentCharacterId) {
        // Change from opponent win to tie
        newState = {
          winnerCharacterId: null,
          index: result.index,
          wasOpponentWin: true
        }
      }

      // Update manual results
      const newManualResults = [...manualResults.value]
      newManualResults[index] = newState
      manualResults.value = newManualResults

      // Broadcast the change
      engagementService.updateResultIndicator(index, newState)
    } finally {
      // Reset the flag
      setTimeout(() => {
        isUpdatingResultLocally.value = false
      }, 100)
    }
  }

  /**
   * Handle remote result indicator update
   * @param {number} index - Comparison index
   * @param {Object} state - New state object
   */
  function handleRemoteResultUpdate(index, state) {
    // Prevent infinite loops
    if (isUpdatingResultLocally.value) {
      return
    }

    // Update manual results
    const newManualResults = [...manualResults.value]
    newManualResults[index] = state
    manualResults.value = newManualResults
  }

  /**
   * Recalculate comparisons by clearing manual results
   */
  function recalculateComparisons() {
    manualResults.value = []
    // Force reactivity update in next tick
    nextTick(() => {
      // This will trigger any computed properties that depend on manual results
    })
  }

  /**
   * Perform initial sort when roll results are received
   */
  function performInitialSort() {
    initialSortDone.value = false
    sortedOrder.value = null
    opponentInitialSortDone.value = false
    opponentSortedOrder.value = null
  }

  /**
   * Reset all dice state for new engagement
   */
  function resetDiceState() {
    manualResults.value = []
    rerollingDice.clear()
    Object.keys(hoverStates).forEach(key => delete hoverStates[key])
    isUpdatingResultLocally.value = false
    initialSortDone.value = false
    sortedOrder.value = null
    opponentInitialSortDone.value = false
    opponentSortedOrder.value = null
  }

  return {
    // State
    manualResults,
    rerollingDice,
    hoverStates,
    
    // Methods
    getSortedDice,
    calculateDiceComparisons,
    determineEngagementWinner,
    countWins,
    countTies,
    showRerollHover,
    rerollDie,
    handleRemoteDieReroll,
    toggleResult,
    handleRemoteResultUpdate,
    recalculateComparisons,
    performInitialSort,
    resetDiceState
  }
}
