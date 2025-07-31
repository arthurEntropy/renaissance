import { ref, reactive, nextTick } from 'vue'
import EngagementRollService from '@/services/EngagementRollService'
import engagementService from '@/services/EngagementService'
import PlayerSides from '@/constants/playerSides'
import { getDiceFontClass, getDiceFontMaxClass } from '../../utils/diceFontUtils'

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

  function getSortedDice(selectedDice, rollResults, characterId, side = PlayerSides.USER, opponent = null) {
    // Check if selectedDice is empty or not an array
    if (!selectedDice || !Array.isArray(selectedDice) || selectedDice.length === 0) {
      return []
    }

    // No results yet - pass null to EngagementRollService to trigger rolling state
    if (!rollResults || !rollResults.session) {
      return EngagementRollService.sortEngagementDice(selectedDice, null)
    }

    // We have roll results, use those values
    let targetResults
    
    if (side === PlayerSides.USER) {
      targetResults = rollResults.session.users.find(user => user.characterInfo.id === characterId)
    } else {
      targetResults = rollResults.session.users.find(user => user.socketId === opponent?.socketId)
    }

    if (!targetResults || !targetResults.rollResults) {
      return EngagementRollService.sortEngagementDice(selectedDice, null)
    }

    // Use EngagementRollService to sort the dice
    const sortedDice = EngagementRollService.sortEngagementDice(selectedDice, targetResults.rollResults)
    
    // Store sorted order so we can maintain it even when rerolls happen
    if (side === PlayerSides.USER && !initialSortDone.value) {
      sortedOrder.value = sortedDice
      initialSortDone.value = true
    } else if (side === PlayerSides.OPPONENT && !opponentInitialSortDone.value) {
      opponentSortedOrder.value = sortedDice
      opponentInitialSortDone.value = true
    }

    // Return existing sorted order with updated values, or the newly sorted dice
    const existingOrder = side === PlayerSides.USER ? sortedOrder.value : opponentSortedOrder.value
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

  function calculateDiceComparisons(userDice, opponentDice, userCharacterId, opponentCharacterId) {
    return EngagementRollService.calculateDiceComparisons(
      userDice, 
      opponentDice, 
      userCharacterId, 
      opponentCharacterId, 
      manualResults.value
    )
  }

  function determineEngagementWinner(diceComparisons, userDice, opponentDice) {
    return EngagementRollService.determineEngagementWinner(diceComparisons, userDice, opponentDice)
  }

  function countWins(diceComparisons, side, userCharacterId, opponentCharacterId) {
    return EngagementRollService.countSideWins(diceComparisons, side, userCharacterId, opponentCharacterId)
  }

  function countTies(diceComparisons) {
    return EngagementRollService.countTies(diceComparisons)
  }

  function showRerollHover(index, show, player = PlayerSides.USER) {
    const key = `${player}-${index}`
    hoverStates[key] = show
  }

  function rerollDie(player, index, characterId, sortedDice, rollResults, opponent, clearSuccessAssignment, animationDuration) {
    // Async because we need to wait for the animation to complete
    return new Promise((resolve) => {
      const rerollKey = `${player}-${index}`

      // Clear any assigned success for this die since it's being re-rolled
      if (clearSuccessAssignment) {
        clearSuccessAssignment(player, index, characterId)
      }

      // Mark this die as re-rolling
      rerollingDice.add(rerollKey)

      // Get the target die
      const targetDie = sortedDice[index]
      if (!targetDie) {
        resolve()
        return
      }

      const originalDieSize = targetDie.die

      // Show max value while re-rolling
      targetDie.class = getDiceFontMaxClass(originalDieSize)
      targetDie.isMax = false

      // Roll new value using EngagementRollService
      const newValue = EngagementRollService.rollSingleDie(originalDieSize)
      const isNewMax = newValue === originalDieSize

      // Broadcast the reroll to other users immediately
      engagementService.rerollDie(player, index, newValue, characterId)

      // After animation completes, show new result
      setTimeout(() => {
        // Update the die with new result
        targetDie.value = newValue
        targetDie.class = getDiceFontClass(originalDieSize, newValue)
        targetDie.isMax = isNewMax

        // Remove from rerolling set
        rerollingDice.delete(rerollKey)

        // Update the roll results using EngagementRollService
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

        // Clear manual results and recalculate
        recalculateComparisons()

        resolve()
      }, animationDuration)
    })
  }

  function handleRemoteDieReroll(player, diceIndex, newValue, characterId, currentCharacterId, targetDice, rollResults, opponent, animationDuration) {
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
    targetDie.class = getDiceFontMaxClass(originalDieSize)
    targetDie.isMax = false

    // After animation, show new result
    setTimeout(() => {
      const isNewMax = newValue === originalDieSize
      targetDie.value = newValue
      targetDie.class = getDiceFontClass(originalDieSize, newValue)
      targetDie.isMax = isNewMax

      // Remove from rerolling set
      rerollingDice.delete(`opponent-${diceIndex}`)

      // Update roll results using EngagementRollService
      EngagementRollService.updateRollResultsAfterReroll(
        rollResults,
        PlayerSides.OPPONENT,
        diceIndex,
        newValue,
        characterId,
        opponent?.socketId,
        targetDice
      )
      
      // Recalculate comparisons
      recalculateComparisons()
    }, animationDuration)
  }

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
      }, 100) // Short delay to prevent rapid toggling
    }
  }

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

  function recalculateComparisons() {
    manualResults.value = []
    // Force reactivity update in next tick
    nextTick(() => {
      // This will trigger any computed properties that depend on manual results
    })
  }

  function performInitialSort() {
    initialSortDone.value = false
    sortedOrder.value = null
    opponentInitialSortDone.value = false
    opponentSortedOrder.value = null
  }

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
