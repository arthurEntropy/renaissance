import { computed, toRef } from 'vue'
import { useEngagementDice } from './useEngagementDice'
import { useEngagementSession } from './useEngagementSession'
import { useEngagementSuccesses } from './useEngagementSuccesses'
import { useSuccessAssignment } from './useSuccessAssignment'
import EngagementWinnerTypes from '@/constants/engagementWinnerTypes'
import RollTypes from '@/constants/rollTypes'
import EngagementResultTypes from '@/constants/engagementResultTypes'
import PlayerSides from '@/constants/playerSides'

export function useEngagement(character, selectedDice, allEquipment, allEngagementSuccesses) {
  // Initialize all sub-composables
  const diceManager = useEngagementDice(toRef(() => character), toRef(() => allEquipment))
  const sessionManager = useEngagementSession()
  const successManager = useEngagementSuccesses(toRef(() => character), toRef(() => allEquipment))
  const assignmentManager = useSuccessAssignment()

  // Unified computed properties that combine multiple composables
  const gameState = computed(() => ({
    isReady: sessionManager.opponent.value && sessionManager.rollResults.value,
    canEdit: sessionManager.canEditResults.value,
    showResults: sessionManager.showResults.value,
    winner: (sessionManager.opponent.value && sessionManager.rollResults.value) ? 
      diceManager.determineEngagementWinner(
        diceComparisons.value,
        sortedSelectedDice.value,
        sortedOpponentDice.value
      ) : null,
    userWinCount: userWinCount.value,
    opponentWinCount: opponentWinCount.value,
    drawCount: drawCount.value
  }))

  // Dice computations
  const sortedSelectedDice = computed(() => {
    if (!selectedDice || !character) return []
    return diceManager.getSortedDice(
      selectedDice,
      sessionManager.rollResults.value,
      character.id,
      PlayerSides.USER
    )
  })

  const sortedOpponentDice = computed(() => {
    if (!sessionManager.opponent.value) return []
    return diceManager.getSortedDice(
      sessionManager.opponent.value.selectedDice,
      sessionManager.rollResults.value,
      character.id,
      PlayerSides.OPPONENT,
      sessionManager.opponent.value
    )
  })

  const diceComparisons = computed(() => {
    if (!sessionManager.showResults.value || !sessionManager.opponent.value) {
      return []
    }
    return diceManager.calculateDiceComparisons(
      sortedSelectedDice.value,
      sortedOpponentDice.value,
      character.id,
      sessionManager.opponent.value.characterInfo.id
    )
  })

  const engagementWinner = computed(() => {
    if (!sessionManager.showResults.value || !sessionManager.opponent.value) {
      return null
    }
    return diceManager.determineEngagementWinner(
      diceComparisons.value,
      sortedSelectedDice.value,
      sortedOpponentDice.value
    )
  })

  const userWinCount = computed(() => {
    if (!sessionManager.showResults.value || diceComparisons.value.length === 0) {
      return 0
    }
    return diceManager.countWins(
      diceComparisons.value,
      PlayerSides.USER,
      character.id,
      sessionManager.opponent.value?.characterInfo?.id
    )
  })

  const opponentWinCount = computed(() => {
    if (!sessionManager.showResults.value || diceComparisons.value.length === 0) {
      return 0
    }
    return diceManager.countWins(
      diceComparisons.value,
      PlayerSides.OPPONENT,
      character.id,
      sessionManager.opponent.value?.characterInfo?.id
    )
  })

  const drawCount = computed(() => {
    if (!sessionManager.showResults.value || diceComparisons.value.length === 0) {
      return 0
    }
    return diceManager.countTies(diceComparisons.value)
  })

  // Column props for user and opponent
  const userColumnProps = computed(() => ({
    character: character,
    dice: sortedSelectedDice.value,
    successes: successManager.allOwnedEngagementSuccesses.value,
    assignedSuccesses: assignmentManager.assignedSuccesses,
    side: PlayerSides.USER,
    isOpponent: false,
    canEdit: sessionManager.canEditResults.value,
    showResults: sessionManager.showResults.value,
    rerollingDice: diceManager.rerollingDice,
    hoverStates: diceManager.hoverStates,
    allEngagementSuccesses: allEngagementSuccesses,
    winner: engagementWinner.value
  }))

  const opponentColumnProps = computed(() => ({
    character: sessionManager.opponent.value?.characterInfo || null,
    dice: sortedOpponentDice.value,
    successes: [], // Opponent successes are shown only when assigned to dice
    assignedSuccesses: assignmentManager.assignedSuccesses,
    side: PlayerSides.OPPONENT,
    isOpponent: true,
    canEdit: false,
    showResults: sessionManager.showResults.value,
    rerollingDice: diceManager.rerollingDice,
    hoverStates: diceManager.hoverStates,
    allEngagementSuccesses: allEngagementSuccesses,
    winner: engagementWinner.value
  }))

  // Unified action methods
  function initializeEngagement(character, selectedDice, characterSuccessIds, eventHandlers) {
    sessionManager.initializeSession(
      character,
      selectedDice,
      characterSuccessIds,
      eventHandlers.resultIndicator,
      eventHandlers.dieRerolled,
      eventHandlers.successAssignment,
      eventHandlers.rollResults
    )
  }

  function cleanupEngagement() {
    sessionManager.disconnect()
    diceManager.resetDiceState()
    assignmentManager.resetAssignments()
  }

  function formatEngagementResults() {
    if (!sessionManager.opponent.value || !sessionManager.showResults.value) return null

    // Determine the result from the user's perspective
    let result
    switch (engagementWinner.value) {
      case EngagementWinnerTypes.USER:
        result = EngagementResultTypes.WIN
        break
      case EngagementWinnerTypes.OPPONENT:
        result = EngagementResultTypes.LOSS
        break
      case EngagementWinnerTypes.TIE:
        result = EngagementResultTypes.DRAW
        break
      default:
        result = EngagementResultTypes.DRAW
    }

    return {
      type: RollTypes.ENGAGEMENT,
      characterName: character.name,
      opponentName: sessionManager.opponent.value.characterInfo.name,
      result: result,
      userWins: userWinCount.value,
      opponentWins: opponentWinCount.value,
      drawCount: drawCount.value,
      timestamp: Date.now()
    }
  }

  return {
    // Sub-composable managers
    diceManager,
    sessionManager,
    successManager,
    assignmentManager,

    // Unified state
    gameState,
    sortedSelectedDice,
    sortedOpponentDice,
    diceComparisons,
    engagementWinner,
    userWinCount,
    opponentWinCount,
    drawCount,

    // Column props
    userColumnProps,
    opponentColumnProps,

    // Unified methods
    initializeEngagement,
    cleanupEngagement,
    formatEngagementResults
  }
}
