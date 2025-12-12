import { ref, reactive, computed, nextTick } from 'vue'
import { DiceStatus } from '@/constants/diceStatus'
import EngagementRollService from '@/services/rolls/engagementRollService'
import DiceRoller from '@/services/rolls/utils/DiceRoller'
import engagementSessionService from '@/services/sessions/engagementSessionService'
import { PlayerSides } from '@/constants/playerSides'
import { RollTypes } from '@/constants/rollTypes'
import { DICE_ROLL_DURATION } from '@/constants/animationDurations'
import { getDiceFontClass, getDiceFontMaxClass } from '@/utils/diceFontUtils'

export function useEngagementRoll(character = null, allEquipment = null) {
  // ==================== STATE ====================
  
  // Dice state
  const diceStatuses = reactive({})
  const manualResults = ref([])
  
  // Sorting state
  const initialSortDone = ref(false)
  const sortedOrder = ref(null)
  const opponentInitialSortDone = ref(false)
  const opponentSortedOrder = ref(null)
  
  // Animation state
  const rerollingDice = reactive(new Set())
  const isUpdatingResultLocally = ref(false)
  const isRerolling = ref(false)
  
  // Stable state for reroll animations
  const previousDicePairs = ref([])
  const previousEngagementWinner = ref(null)

  // ==================== COMPUTED - DICE DATA ====================
  
  // Engagement dice provided by the character's equipment
  const equipmentEngagementDice = computed(() => {
    const result = []

    if (!character?.value?.equipment || !allEquipment?.value) {
      return result
    }

    // Equipment items must be wielded to contribute engagement dice
    const wieldedEquipment = (character.value.equipment || [])
      .filter((item) => item.isWielding)
      .map((item) => allEquipment.value.find((eq) => eq.id === item.id))
      .filter((equipment) => equipment && equipment.engagementDice && equipment.engagementDice.length > 0)

    wieldedEquipment.forEach(equipment => {
      if (equipment.engagementDice) {
        equipment.engagementDice.forEach((die, dieIndex) => {
          const statusKey = `${equipment.id}_${dieIndex}`
          const status = diceStatuses[statusKey] || DiceStatus.AVAILABLE
          result.push({
            die,
            name: equipment.name,
            equipmentId: equipment.id,
            dieIndex,
            statusKey,
            status,
            isUserAdded: false
          })
        })
      }
    })

    return result
  })

  // Engagement dice manually added by the user
  const userAddedEngagementDice = computed(() => {
    const rawDice = character?.value?.engagementDice || []
    return rawDice.map((die, index) => {
      const statusKey = `user_added_${index}`
      const status = diceStatuses[statusKey] || DiceStatus.AVAILABLE
      return {
        die,
        name: '(added manually)',
        userAddedIndex: index,
        statusKey,
        status,
        isUserAdded: true
      }
    })
  })

  // All engagement dice available to the character
  const allOwnedEngagementDice = computed(() => {
    const allDice = [
      ...equipmentEngagementDice.value,
      ...userAddedEngagementDice.value
    ]

    return allDice.sort((a, b) => a.die - b.die)
  })

  // ==================== COMPUTED - DICE STATUS ====================
  
  const selectedDiceValues = computed(() => {
    return allOwnedEngagementDice.value
      .filter(item => item.status === DiceStatus.SELECTED)
      .map(item => ({ dieSides: item.die }))
  })

  const hasExpendedDice = computed(() => {
    return Object.values(diceStatuses).includes(DiceStatus.EXPENDED)
  })
  
  const hasRerollingDice = computed(() => {
    return rerollingDice.size > 0
  })

  // ==================== METHODS - STATE MANAGEMENT ====================
  
  function toggleDiceStatus(diceInfo) {
    const currentStatus = diceStatuses[diceInfo.statusKey] || DiceStatus.AVAILABLE
    let newStatus

    switch (currentStatus) {
      case DiceStatus.AVAILABLE:
        newStatus = DiceStatus.SELECTED
        break
      case DiceStatus.SELECTED:
        newStatus = DiceStatus.EXPENDED
        break
      case DiceStatus.EXPENDED:
        newStatus = DiceStatus.AVAILABLE
        break
      default:
        newStatus = DiceStatus.AVAILABLE
    }

    diceStatuses[diceInfo.statusKey] = newStatus
  }

  function resetDice() {
    if (!hasExpendedDice.value) {
      return
    }

    Object.keys(diceStatuses).forEach(key => delete diceStatuses[key])
  }

  function markSelectedDiceAsExpended() {
    Object.keys(diceStatuses).forEach(key => {
      if (diceStatuses[key] === DiceStatus.SELECTED) {
        diceStatuses[key] = DiceStatus.EXPENDED
      }
    })
  }

  function addUserAddedDie(die, updateCharacterCallback) {
    if (!character?.value || !updateCharacterCallback) return

    const currentDice = character.value.engagementDice || []
    const updatedDice = [...currentDice, die]

    const updatedCharacter = {
      ...character.value,
      engagementDice: updatedDice
    }

    updateCharacterCallback(updatedCharacter)
  }

  function removeUserAddedDie(index, updateCharacterCallback) {
    if (!character?.value || !updateCharacterCallback) return

    const currentDice = character.value.engagementDice || []
    const updatedDice = currentDice.filter((_, i) => i !== index)

    const updatedCharacter = {
      ...character.value,
      engagementDice: updatedDice
    }

    updateCharacterCallback(updatedCharacter)
  }

  function resetSortingState() {
    initialSortDone.value = false
    sortedOrder.value = null
    opponentInitialSortDone.value = false
    opponentSortedOrder.value = null
  }

  // ==================== METHODS - CALCULATIONS ====================
  
  // Update existing sorted dice with new values
  function updateExistingOrder(existingOrder, newSortedDice, side) {
    let hasChanges = false
    
    const updatedOrder = existingOrder.map((sortedDie, index) => {
      // If this die is currently rerolling, preserve its state
      if (side) {
        const rerollKey = `${side}-${index}`
        if (rerollingDice.has(rerollKey)) {
          return sortedDie
        }
      }

      const originalDie = newSortedDice.find(d => d.poolIndex === sortedDie.poolIndex)
      if (originalDie) {
        if (sortedDie.dieRollValue !== originalDie.dieRollValue ||
            sortedDie.rolledMaxValue !== originalDie.rolledMaxValue ||
            sortedDie.isRolling !== originalDie.isRolling) {
          hasChanges = true
          return {
            ...sortedDie,
            dieRollValue: originalDie.dieRollValue,
            cssClass: originalDie.cssClass,
            rolledMaxValue: originalDie.rolledMaxValue,
            isRolling: originalDie.isRolling
          }
        }
      }
      return sortedDie
    })
    
    return hasChanges ? updatedOrder : existingOrder
  }

  function getSortedDice(selectedDice, rollResults, characterId, side = PlayerSides.USER, opponent = null) {
    if (!selectedDice || !Array.isArray(selectedDice) || selectedDice.length === 0) {
      return []
    }

    // Find target results for this side
    let targetResults = null
    if (rollResults?.session?.users) {
      targetResults = side === PlayerSides.USER
        ? rollResults.session.users.find(user => user.characterInfo.id === characterId)
        : rollResults.session.users.find(user => user.socketId === opponent?.socketId)
    }

    // Prepare dice for display
    const targetRollResults = targetResults?.rollResults
    const sortedDice = targetRollResults
      ? EngagementRollService.formatDiceForDisplay(targetRollResults, RollTypes.ENGAGEMENT)
      : EngagementRollService.createMaxValueDiceResult(selectedDice, RollTypes.ENGAGEMENT)

    // Get side-specific state references
    const isUser = side === PlayerSides.USER
    const sortDoneRef = isUser ? initialSortDone : opponentInitialSortDone
    const sortedOrderRef = isUser ? sortedOrder : opponentSortedOrder
    
    if (!sortDoneRef.value) {
      sortedOrderRef.value = sortedDice
      sortDoneRef.value = true
      return sortedDice
    }

    return updateExistingOrder(sortedOrderRef.value, sortedDice, side)
  }

  function getSortedUserDice(selectedDice, sessionData, rollResults, characterId) {
    const rollResultsFromSession = rollResults || (sessionData ? { session: sessionData } : null)
    return getSortedDice(selectedDice, rollResultsFromSession, characterId, PlayerSides.USER, null)
  }

  function getSortedOpponentDice(opponentData, sessionData, rollResults, characterId) {
    if (!opponentData) return []
    const rollResultsFromSession = rollResults || (sessionData ? { session: sessionData } : null)
    return getSortedDice(opponentData.selectedDice, rollResultsFromSession, characterId, PlayerSides.OPPONENT, opponentData)
  }

  function calculateDiceComparisons(userDice, opponentDice, userCharacterId, opponentCharacterId) {
    // Get stable dice for comparison (use previous values during reroll animations)
    const stableUserDice = userDice.map((die, index) => {
      const rerollKey = `${PlayerSides.USER}-${index}`
      if (rerollingDice.has(rerollKey) && die.previousValue !== undefined) {
        return { ...die, dieRollValue: die.previousValue }
      }
      return die
    })
    
    const stableOpponentDice = opponentDice.map((die, index) => {
      const rerollKey = `${PlayerSides.OPPONENT}-${index}`
      if (rerollingDice.has(rerollKey) && die.previousValue !== undefined) {
        return { ...die, dieRollValue: die.previousValue }
      }
      return die
    })
    
    return EngagementRollService.calculateDiceComparisons(
      stableUserDice, 
      stableOpponentDice, 
      userCharacterId, 
      opponentCharacterId, 
      manualResults.value
    )
  }

  function calculateWinCounts(dicePairs, userCharacterId, opponentCharacterId) {
    if (!dicePairs || dicePairs.length === 0) {
      return { userWins: 0, opponentWins: 0, draws: 0 }
    }

    return {
      userWins: EngagementRollService.countSideWins(dicePairs, PlayerSides.USER, userCharacterId, opponentCharacterId),
      opponentWins: EngagementRollService.countSideWins(dicePairs, PlayerSides.OPPONENT, userCharacterId, opponentCharacterId),
      draws: EngagementRollService.countTies(dicePairs)
    }
  }

  // ==================== METHODS - ANIMATIONS ====================
  
  function startRerolling() {
    isRerolling.value = true
  }

  function stopRerolling() {
    isRerolling.value = false
  }

  // Stable as in keeping previous values during reroll animations
  function getStableDicePairs(userDice, opponentDice, userCharacterId, opponentCharacterId) {
    if (hasRerollingDice.value && previousDicePairs.value.length > 0) {
      return previousDicePairs.value
    }

    const pairs = calculateDiceComparisons(userDice, opponentDice, userCharacterId, opponentCharacterId)
    
    if (!hasRerollingDice.value && pairs.length > 0) {
      previousDicePairs.value = [...pairs]
    }

    return pairs
  }

  // Stable as in keeping previous winner during reroll animations
  function getStableEngagementWinner(dicePairs, userDice, opponentDice) {
    if (hasRerollingDice.value && previousEngagementWinner.value !== null) {
      return previousEngagementWinner.value
    }

    const winner = EngagementRollService.determineEngagementWinner(dicePairs, userDice, opponentDice)
    
    if (!hasRerollingDice.value && winner !== null) {
      previousEngagementWinner.value = winner
    }

    return winner
  }

  async function rerollDie(player, index, characterId, sortedDice, rollResults, opponent, clearSuccessAssignment, animationDuration, sessionManager) {
    return new Promise((resolve) => {
      const rerollKey = `${player}-${index}`

      if (clearSuccessAssignment) {
        clearSuccessAssignment(player, index, characterId)
      }

      const targetDie = sortedDice[index]
      if (!targetDie) {
        resolve()
        return
      }

      const originalDieSize = targetDie.dieSides

      if (sessionManager?.startRerolling) {
        sessionManager.startRerolling()
      }

      rerollingDice.add(rerollKey)
      targetDie.previousValue = targetDie.dieRollValue
      targetDie.cssClass = getDiceFontMaxClass(originalDieSize)
      targetDie.rolledMaxValue = false

      const newValue = DiceRoller.rollDie(originalDieSize)
      const isNewMax = newValue === originalDieSize

      engagementSessionService.rerollDie(player, targetDie.poolIndex, newValue, characterId)

      setTimeout(() => {
        targetDie.dieRollValue = newValue
        targetDie.cssClass = getDiceFontClass(originalDieSize, newValue)
        targetDie.rolledMaxValue = isNewMax

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

        recalculateResults()

        nextTick(() => {
          rerollingDice.delete(rerollKey)
          delete targetDie.previousValue

          if (sessionManager?.stopRerolling) {
            sessionManager.stopRerolling()
          }
        })

        resolve()
      }, animationDuration)
    })
  }

  function handleRemoteDieReroll(player, originalDiceIndex, newValue, characterId, currentCharacterId, targetDice, rollResults, opponent, animationDuration, sessionManager) {
    if (characterId === currentCharacterId) {
      return
    }

    const targetDie = targetDice.find(die => die.poolIndex === originalDiceIndex)
    if (!targetDie) {
      return
    }

    const sortedPosition = targetDice.findIndex(die => die.poolIndex === originalDiceIndex)
    const rerollKey = `${PlayerSides.OPPONENT}-${sortedPosition}`

    if (!rerollingDice.has(rerollKey)) {
      rerollingDice.add(rerollKey)
      
      if (sessionManager?.startRerolling) {
        sessionManager.startRerolling()
      }
    }

    targetDie.previousValue = targetDie.dieRollValue

    const originalDieSize = targetDie.dieSides
    targetDie.cssClass = getDiceFontMaxClass(originalDieSize)
    targetDie.rolledMaxValue = false

    setTimeout(() => {
      const isNewMax = newValue === originalDieSize
      targetDie.dieRollValue = newValue
      targetDie.cssClass = getDiceFontClass(originalDieSize, newValue)
      targetDie.rolledMaxValue = isNewMax

      EngagementRollService.updateRollResultsAfterReroll(
        rollResults,
        PlayerSides.OPPONENT,
        sortedPosition,
        newValue,
        characterId,
        opponent?.socketId,
        targetDice
      )
      
      recalculateResults()

      nextTick(() => {
        rerollingDice.delete(rerollKey)
        delete targetDie.previousValue

        if (sessionManager?.stopRerolling) {
          sessionManager.stopRerolling()
        }
      })
    }, animationDuration)
  }

  function resetAnimationState() {
    rerollingDice.clear()
    isUpdatingResultLocally.value = false
    previousDicePairs.value = []
    previousEngagementWinner.value = null
  }

  // ==================== METHODS - EVENTS ====================
  
  function toggleResult(index, diceComparisons, userCharacterId, opponentCharacterId) {
    if (isUpdatingResultLocally.value) {
      return
    }

    isUpdatingResultLocally.value = true

    try {
      if (!manualResults.value[index]) {
        const pair = diceComparisons[index]
        const newManualResults = [...manualResults.value]
        newManualResults[index] = {
          winnerCharacterId: pair.winnerCharacterId,
          index: pair.index
        }
        manualResults.value = newManualResults
      }

      const result = manualResults.value[index]
      let newState

      if (result.winnerCharacterId === userCharacterId) {
        newState = { winnerCharacterId: null, index }
      } else if (!result.winnerCharacterId) {
        newState = { winnerCharacterId: opponentCharacterId, index }
      } else {
        newState = { winnerCharacterId: userCharacterId, index }
      }

      const newManualResults = [...manualResults.value]
      newManualResults[index] = newState
      manualResults.value = newManualResults

      engagementSessionService.updateResultIndicator(index, newState)
    } finally {
      isUpdatingResultLocally.value = false
    }
  }

  function handleRemoteResultUpdate(index, state) {
    if (isUpdatingResultLocally.value) {
      return
    }

    const newManualResults = [...manualResults.value]
    newManualResults[index] = state
    manualResults.value = newManualResults
  }

  function recalculateResults() {
    manualResults.value = []
    nextTick(() => {
      // Results will be recalculated automatically due to reactivity
    })
  }

  function createToggleResultHandler(sessionManager, character, selectedDiceRef) {
    return (index) => {
      if (!sessionManager.opponent.value) return

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

      const diceComparisons = calculateDiceComparisons(
        userDice,
        opponentDice,
        character.id,
        sessionManager.opponent.value.characterInfo.id
      )

      toggleResult(
        index,
        diceComparisons,
        character.id,
        sessionManager.opponent.value.characterInfo.id
      )
    }
  }

  function createRerollDieHandler(sessionManager, character, selectedDiceRef, successManager) {
    return async (player, index) => {
      if (!sessionManager.opponent.value) return

      const sortedDice = getSortedUserDice(
        selectedDiceRef.value || selectedDiceRef,
        sessionManager.sessionData?.value,
        sessionManager.rollResults.value,
        character.id
      )

      await rerollDie(
        player,
        index,
        character.id,
        sortedDice,
        sessionManager.rollResults.value,
        sessionManager.opponent.value,
        successManager.clearSuccessAssignment,
        DICE_ROLL_DURATION,
        { startRerolling, stopRerolling }
      )
    }
  }

  // ==================== HIGH-LEVEL INTEGRATION ====================
  
  function getDicePairs(sessionManager, character, selectedDiceRef) {
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

    return getStableDicePairs(
      userDice,
      opponentDice,
      character.id,
      sessionManager.opponent.value.characterInfo.id
    )
  }

  function getEngagementWinner(sessionManager, character, selectedDiceRef) {
    if (!sessionManager.showResults.value || !sessionManager.opponent.value) {
      return null
    }

    const selectedDice = selectedDiceRef.value || selectedDiceRef
    const dicePairs = getDicePairs(sessionManager, character, selectedDice)
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

    return getStableEngagementWinner(dicePairs, userDice, opponentDice)
  }

  function getWinCounts(sessionManager, character, selectedDiceRef) {
    if (!sessionManager.showResults.value || !sessionManager.opponent.value) {
      return { userWins: 0, opponentWins: 0, draws: 0 }
    }

    const selectedDice = selectedDiceRef.value || selectedDiceRef
    const dicePairs = getDicePairs(sessionManager, character, selectedDice)
    
    if (dicePairs.length === 0) {
      return { userWins: 0, opponentWins: 0, draws: 0 }
    }

    return calculateWinCounts(
      dicePairs,
      character.id,
      sessionManager.opponent.value?.characterInfo?.id
    )
  }

  function generateColumnProps(sessionManager, successManager, character, selectedDiceRef, characterSuccesses, allEngagementSuccesses) {
    const selectedDice = selectedDiceRef.value || selectedDiceRef
    const winner = getEngagementWinner(sessionManager, character, selectedDice)
    
    const commonProps = {
      assignedSuccesses: successManager.assignedSuccesses,
      showResults: sessionManager.showResults.value,
      rerollingDice: rerollingDice,
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
      successes: [],
      side: PlayerSides.OPPONENT,
      isOpponent: true,
      canEdit: false
    }

    return { userColumnProps, opponentColumnProps }
  }

  // ==================== RETURN ====================
  
  return {
    // Constants
    DICE_ROLL_DURATION,
    
    // Computed - dice data
    allOwnedEngagementDice,
    
    // Computed - dice status
    selectedDiceValues,
    hasExpendedDice,
    
    // State management
    toggleDiceStatus,
    resetDice,
    markSelectedDiceAsExpended,
    addUserAddedDie,
    removeUserAddedDie,
    resetSortingState,
    
    // Rerolling control (used by EngagementRollModal)
    startRerolling,
    stopRerolling,
    
    // Calculations (used by EngagementRollModal)
    getSortedOpponentDice,
    
    // Animations (used by EngagementRollModal)
    handleRemoteDieReroll,
    
    // Events (used by EngagementRollModal)
    handleRemoteResultUpdate,
    createToggleResultHandler,
    createRerollDieHandler,
    
    // High-level integration (used by EngagementRollModal)
    getDicePairs,
    getEngagementWinner,
    getWinCounts,
    generateColumnProps
  }
}
