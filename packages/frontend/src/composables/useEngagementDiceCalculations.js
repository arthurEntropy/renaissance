import EngagementRollService from '@/services/engagementRollService'
import PlayerSides from '@/constants/playerSides'

/**
 * Composable for dice calculations, comparisons, and winner determination
 * Handles complex logic for dice sorting, pairing, and result calculations
 */
export function useEngagementDiceCalculations(diceState) {
  const {
    manualResults,
    initialSortDone,
    sortedOrder,
    opponentInitialSortDone,
    opponentSortedOrder
  } = diceState

  // Helper function to get side-specific state references
  function getSideStateRefs(side) {
    const isUser = side === PlayerSides.USER
    return {
      sortDoneRef: isUser ? initialSortDone : opponentInitialSortDone,
      sortedOrderRef: isUser ? sortedOrder : opponentSortedOrder
    }
  }

  // Helper function to find target results for a side
  function findTargetResults(rollResults, characterId, side, opponent) {
    if (!rollResults?.session?.users) return null
    
    return side === PlayerSides.USER
      ? rollResults.session.users.find(user => user.characterInfo.id === characterId)
      : rollResults.session.users.find(user => user.socketId === opponent?.socketId)
  }

  // Helper function to sort dice with fallback handling
  function sortDiceWithFallback(selectedDice, targetResults) {
    const rollResultsToUse = targetResults?.rollResults || null
    return EngagementRollService.sortEngagementDice(selectedDice, rollResultsToUse)
  }

  // Helper function to update existing sorted dice with new values
  function updateExistingOrder(existingOrder, newSortedDice) {
    existingOrder.forEach((sortedDie) => {
      const originalDie = newSortedDice.find(d => d.originalIndex === sortedDie.originalIndex)
      if (originalDie) {
        sortedDie.value = originalDie.value
        sortedDie.class = originalDie.class
        sortedDie.isMax = originalDie.isMax
        sortedDie.isRolling = originalDie.isRolling
      }
    })
    return existingOrder
  }

  // Core dice sorting logic
  function getSortedDice(selectedDice, rollResults, characterId, side = PlayerSides.USER, opponent = null) {
    // Early return for invalid input
    if (!selectedDice || !Array.isArray(selectedDice) || selectedDice.length === 0) {
      return []
    }

    // Find target results for this side/character
    const targetResults = findTargetResults(rollResults, characterId, side, opponent)
    
    // Sort dice (handles both null results and valid results)
    const sortedDice = sortDiceWithFallback(selectedDice, targetResults)
    
    // Get state references for this side
    const { sortDoneRef, sortedOrderRef } = getSideStateRefs(side)
    
    // Store initial sort if not done yet
    if (!sortDoneRef.value) {
      sortedOrderRef.value = sortedDice
      sortDoneRef.value = true
    }

    // Return existing sorted order with updated values, or the newly sorted dice
    const existingOrder = sortedOrderRef.value
    if (existingOrder) {
      return updateExistingOrder(existingOrder, sortedDice)
    }

    return sortedDice
  }

  function getSortedUserDice(selectedDice, sessionData, rollResults, characterId) {
    // Use sessionData as the source of truth for dice values, with fallback to rollResults
    const rollResultsFromSession = sessionData ? {
      session: sessionData
    } : rollResults

    return getSortedDice(
      selectedDice,
      rollResultsFromSession,
      characterId,
      PlayerSides.USER
    )
  }

  function getSortedOpponentDice(opponentData, sessionData, rollResults, characterId) {
    if (!opponentData) return []

    // Use sessionData as the source of truth for dice values, with fallback to rollResults
    const rollResultsFromSession = sessionData ? {
      session: sessionData
    } : rollResults

    return getSortedDice(
      opponentData.selectedDice,
      rollResultsFromSession,
      characterId,
      PlayerSides.OPPONENT,
      opponentData
    )
  }

  function calculateDiceComparisons(userDice, opponentDice, userCharacterId, opponentCharacterId, rerollingDice) {
    // If any dice are currently rerolling, use their previous values for comparisons
    const stableUserDice = getStableDiceForComparison(userDice, PlayerSides.USER, rerollingDice)
    const stableOpponentDice = getStableDiceForComparison(opponentDice, PlayerSides.OPPONENT, rerollingDice)
    
    return EngagementRollService.calculateDiceComparisons(
      stableUserDice, 
      stableOpponentDice, 
      userCharacterId, 
      opponentCharacterId, 
      manualResults.value
    )
  }

  function getStableDiceForComparison(dice, side, rerollingDice) {
    // Return a copy of dice with rerolling dice showing their previous values
    return dice.map((die, index) => {
      const rerollKey = `${side}-${index}`
      if (rerollingDice.has(rerollKey) && die.previousValue !== undefined) {
        // Use previous value during animation
        return {
          ...die,
          value: die.previousValue
        }
      }
      return die
    })
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

  function calculateWinCounts(dicePairs, userCharacterId, opponentCharacterId) {
    if (!dicePairs || dicePairs.length === 0) {
      return {
        userWins: 0,
        opponentWins: 0,
        draws: 0
      }
    }

    return {
      userWins: countWins(dicePairs, PlayerSides.USER, userCharacterId, opponentCharacterId),
      opponentWins: countWins(dicePairs, PlayerSides.OPPONENT, userCharacterId, opponentCharacterId),
      draws: countTies(dicePairs)
    }
  }

  // High-level dice computations that integrate with session data
  function getDicePairs(sessionManager, character, selectedDiceRef, animations) {
    if (!sessionManager.showResults.value || !sessionManager.opponent.value) {
      return []
    }

    const selectedDice = selectedDiceRef.value || selectedDiceRef
    const userDice = getSortedUserDice(
      selectedDice,
      sessionManager.sessionData?.value,
      sessionManager.rollResults.value,
      character.id
    )

    const opponentDice = getSortedOpponentDice(
      sessionManager.opponent.value,
      sessionManager.sessionData?.value,
      sessionManager.rollResults.value,
      character.id
    )

    // Use the animations composable to get stable dice pairs
    return animations.getStableDicePairs(
      userDice,
      opponentDice,
      character.id,
      sessionManager.opponent.value.characterInfo.id,
      (userDice, opponentDice, userCharacterId, opponentCharacterId, rerollingDice) => 
        calculateDiceComparisons(userDice, opponentDice, userCharacterId, opponentCharacterId, rerollingDice)
    )
  }

  function getEngagementWinner(sessionManager, character, selectedDiceRef, animations) {
    if (!sessionManager.showResults.value || !sessionManager.opponent.value) {
      return null
    }

    const selectedDice = selectedDiceRef.value || selectedDiceRef
    const dicePairs = getDicePairs(sessionManager, character, selectedDice, animations)
    const userDice = getSortedUserDice(
      selectedDice,
      sessionManager.sessionData?.value,
      sessionManager.rollResults.value,
      character.id
    )
    const opponentDice = getSortedOpponentDice(
      sessionManager.opponent.value,
      sessionManager.sessionData?.value,
      sessionManager.rollResults.value,
      character.id
    )

    return animations.getStableEngagementWinner(dicePairs, userDice, opponentDice, determineEngagementWinner)
  }

  function getWinCounts(sessionManager, character, selectedDiceRef, animations) {
    if (!sessionManager.showResults.value || !sessionManager.opponent.value) {
      return { userWins: 0, opponentWins: 0, draws: 0 }
    }

    const selectedDice = selectedDiceRef.value || selectedDiceRef
    const dicePairs = getDicePairs(sessionManager, character, selectedDice, animations)
    
    if (dicePairs.length === 0) {
      return { userWins: 0, opponentWins: 0, draws: 0 }
    }

    return calculateWinCounts(
      dicePairs,
      character.id,
      sessionManager.opponent.value?.characterInfo?.id
    )
  }

  // Column props generation for dice-related data
  function generateColumnProps(sessionManager, successManager, character, selectedDiceRef, characterSuccesses, allEngagementSuccesses, animations) {
    const selectedDice = selectedDiceRef.value || selectedDiceRef
    const winner = getEngagementWinner(sessionManager, character, selectedDice, animations)
    
    const commonProps = {
      assignedSuccesses: successManager.assignedSuccesses,
      showResults: sessionManager.showResults.value,
      rerollingDice: animations.rerollingDice || new Set(),
      allEngagementSuccesses: allEngagementSuccesses,
      winner: winner
    }

    const userDice = getSortedUserDice(
      selectedDice,
      sessionManager.sessionData?.value,
      sessionManager.rollResults.value,
      character.id
    )

    const opponentDice = getSortedOpponentDice(
      sessionManager.opponent.value,
      sessionManager.sessionData?.value,
      sessionManager.rollResults.value,
      character.id
    )

    const userColumnProps = {
      ...commonProps,
      character: character,
      dice: userDice,
      successes: characterSuccesses,
      side: PlayerSides.USER,
      isOpponent: false,
      canEdit: sessionManager.canEditResults.value
    }

    const opponentColumnProps = {
      ...commonProps,
      character: sessionManager.opponent.value?.characterInfo || null,
      dice: opponentDice,
      successes: [], // Opponent successes are shown only when assigned to dice
      side: PlayerSides.OPPONENT,
      isOpponent: true,
      canEdit: false
    }

    return { userColumnProps, opponentColumnProps }
  }

  return {
    // Core sorting functions
    getSortedDice,
    getSortedUserDice,
    getSortedOpponentDice,
    
    // Calculation functions
    calculateDiceComparisons,
    getStableDiceForComparison,
    determineEngagementWinner,
    countWins,
    countTies,
    calculateWinCounts,
    
    // High-level integration functions
    getDicePairs,
    getEngagementWinner,
    getWinCounts,
    generateColumnProps
  }
}
