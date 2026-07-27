import { ref, reactive, computed, nextTick, watch } from 'vue'
import { DiceStatus } from '@/constants/diceStatus'
import EngagementRollService from '@/services/rolls/engagementRollService'
import DiceRoller from '@/services/rolls/utils/DiceRoller'
import engagementSessionService from '@/services/sessions/engagementSessionService'
import { PlayerSides } from '@/constants/playerSides'
import { RollTypes } from '@/constants/rollTypes'
import { DICE_ROLL_DURATION } from '@/constants/animationDurations'
import { getDiceFontClass, getDiceFontMaxClass } from '@/utils/diceFontUtils'
import { useCharactersStore } from '@/stores/charactersStore'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { useConceptsStore } from '@/stores/conceptsStore'
import { STANDARD_DIE_SIZES } from '@shared/constants/dice'


// Singleton state - shared across all instances
let sharedState = null

function createSharedState() {
  const charactersStore = useCharactersStore()
  const equipmentStore = useEquipmentStore()
  const conceptsStore = useConceptsStore()

  const character = computed(() => charactersStore.selectedCharacter)
  const allEquipment = computed(() => equipmentStore.equipment || [])
  const characterMestiere = computed(() => conceptsStore.concepts?.find(c => c.id === character.value?.mestiereId) ?? null)

  // Dice state
  const diceStatuses = reactive({})
  const manualResults = ref([])
  const committedDice = ref([]) // Snapshot of dice committed to current engagement

  const loadDiceStatusesFromCharacter = () => {
    const persistedStatuses = character.value?.engagementDiceStatuses
    const normalizedStatuses = persistedStatuses && typeof persistedStatuses === 'object' && !Array.isArray(persistedStatuses)
      ? persistedStatuses
      : {}

    Object.keys(diceStatuses).forEach(key => {
      delete diceStatuses[key]
    })

    Object.entries(normalizedStatuses).forEach(([key, status]) => {
      if (Object.values(DiceStatus).includes(status)) {
        diceStatuses[key] = status
      }
    })
  }

  const getValidStatusKeys = () => {
    const keys = new Set()

    const equippedItems = character.value?.equipment || []
    const equipmentById = new Map((allEquipment.value || []).map(item => [item.id, item]))

    equippedItems
      .filter(item => item.isWielding)
      .forEach(item => {
        const equipment = equipmentById.get(item.id)
        const dice = equipment?.engagementDice || []

        dice.forEach((_, dieIndex) => {
          keys.add(`${item.id}_${dieIndex}`)
        })
      })

    const userAddedDice = character.value?.engagementDice || []
    userAddedDice.forEach((_, index) => {
      keys.add(`user_added_${index}`)
    })

    const mestiereDice = characterMestiere.value?.novizio?.engagementDice
    if (Array.isArray(mestiereDice)) {
      mestiereDice.forEach((die, dieIndex) => {
        const dieSide = typeof die === 'number' ? die : Number(die?.dieSize)
        if (STANDARD_DIE_SIZES.has(dieSide)) {
          keys.add(`mestiere_${dieIndex}`)
        }
      })
    }

    return keys
  }

  const pruneStaleDiceStatuses = () => {
    const validKeys = getValidStatusKeys()
    let removedAny = false

    Object.keys(diceStatuses).forEach(key => {
      if (!validKeys.has(key)) {
        delete diceStatuses[key]
        removedAny = true
      }
    })

    return removedAny
  }

  const persistDiceStatusesToCharacter = () => {
    if (!character.value) {
      return
    }

    character.value.engagementDiceStatuses = { ...diceStatuses }
  }

  watch(
    () => character.value?.id,
    () => {
      loadDiceStatusesFromCharacter()
      pruneStaleDiceStatuses()
    },
    { immediate: true }
  )

  watch(
    () => {
      const validKeys = Array.from(getValidStatusKeys()).sort()
      return `${character.value?.id || 'no-character'}|${validKeys.join('|')}`
    },
    () => {
      if (pruneStaleDiceStatuses()) {
        persistDiceStatusesToCharacter()
      }
    }
  )
  
  // Sorting state
  const initialSortDone = ref(false)
  const sortedOrder = ref(null)
  const opponentInitialSortDone = ref(false)
  const opponentSortedOrder = ref(null)
  
  // Animation state
  const rerollingDice = ref(new Set())
  const isUpdatingResultLocally = ref(false)
  const isRerolling = ref(false)
  
  // Stable state for reroll animations
  const previousDicePairs = ref([])
  const previousEngagementWinner = ref(null)

  return {
    character,
    allEquipment,
    characterMestiere,
    diceStatuses,
    persistDiceStatusesToCharacter,
    manualResults,
    committedDice,
    initialSortDone,
    sortedOrder,
    opponentInitialSortDone,
    opponentSortedOrder,
    rerollingDice,
    isUpdatingResultLocally,
    isRerolling,
    previousDicePairs,
    previousEngagementWinner
  }
}

export function useEngagementRoll() {
  // Initialize singleton state on first use
  if (!sharedState) {
    sharedState = createSharedState()
  }

  const {
    character,
    allEquipment,
    characterMestiere,
    diceStatuses,
    persistDiceStatusesToCharacter,
    manualResults,
    committedDice,
    initialSortDone,
    sortedOrder,
    opponentInitialSortDone,
    opponentSortedOrder,
    rerollingDice,
    isUpdatingResultLocally,
    isRerolling,
    previousDicePairs,
    previousEngagementWinner
  } = sharedState

  // ==================== COMPUTED - DICE DATA ====================
  
  // Engagement dice provided by the character's mestiere (auto-populated from novizio data)
  const mestiereEngagementDice = computed(() => {
    const mestiere = characterMestiere.value
    if (!Array.isArray(mestiere?.novizio?.engagementDice)) return []

    const result = []
    mestiere.novizio.engagementDice.forEach((die, dieIndex) => {
      const dieSide = typeof die === 'number' ? die : Number(die?.dieSize)
      if (!STANDARD_DIE_SIZES.has(dieSide)) {
        return
      }

      const statusKey = `mestiere_${dieIndex}`
      const status = diceStatuses[statusKey] || DiceStatus.AVAILABLE
      result.push({
        die: dieSide,
        name: mestiere.name,
        statusKey,
        status,
        isUserAdded: false,
        isMestiere: true
      })
    })
    return result
  })

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
      ...mestiereEngagementDice.value,
      ...equipmentEngagementDice.value,
      ...userAddedEngagementDice.value
    ]

    return allDice.sort((a, b) => a.die - b.die)
  })

  const selectedDiceValues = computed(() => {
    return allOwnedEngagementDice.value
      .filter(item => item.status === DiceStatus.SELECTED)
      .map(item => ({ dieSize: item.die }))
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
    persistDiceStatusesToCharacter()
  }

  function resetDice() {
    if (!hasExpendedDice.value) {
      return
    }

    Object.keys(diceStatuses).forEach(key => delete diceStatuses[key])
    persistDiceStatusesToCharacter()
  }

  function markSelectedDiceAsExpended() {
    let hasChanges = false

    Object.keys(diceStatuses).forEach(key => {
      if (diceStatuses[key] === DiceStatus.SELECTED) {
        diceStatuses[key] = DiceStatus.EXPENDED
        hasChanges = true
      }
    })

    if (hasChanges) {
      persistDiceStatusesToCharacter()
    }
  }

  function addUserAddedDie(die) {
    if (!character?.value) return

    if (!character.value.engagementDice) {
      character.value.engagementDice = []
    }
    character.value.engagementDice.push(die)
  }

  function removeUserAddedDie(index) {
    if (!character?.value?.engagementDice) return

    const previousStatuses = { ...diceStatuses }

    character.value.engagementDice.splice(index, 1)

    Object.keys(diceStatuses).forEach(key => {
      if (key.startsWith('user_added_')) {
        delete diceStatuses[key]
      }
    })

    Object.entries(previousStatuses).forEach(([key, status]) => {
      if (!key.startsWith('user_added_')) {
        return
      }

      const previousIndex = Number(key.replace('user_added_', ''))
      if (!Number.isInteger(previousIndex)) {
        return
      }

      if (previousIndex < index) {
        diceStatuses[`user_added_${previousIndex}`] = status
      } else if (previousIndex > index) {
        diceStatuses[`user_added_${previousIndex - 1}`] = status
      }
    })

    persistDiceStatusesToCharacter()
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
        if (rerollingDice.value.has(rerollKey)) {
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
      if (rerollingDice.value.has(rerollKey) && die.previousValue !== undefined) {
        return { ...die, dieRollValue: die.previousValue }
      }
      return die
    })
    
    const stableOpponentDice = opponentDice.map((die, index) => {
      const rerollKey = `${PlayerSides.OPPONENT}-${index}`
      if (rerollingDice.value.has(rerollKey) && die.previousValue !== undefined) {
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

  // ==================== METHODS - STABLE STATE (ANIMATIONS) ====================
  
  // Returns dice pairs with stable values during reroll animations
  // This prevents UI flickering by showing previous values until animation completes
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

  // Returns winner with stable value during reroll animations
  // This prevents winner indicator from jumping around while dice are rerolling
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

      const originalDieSize = targetDie.die.dieSize

      if (sessionManager?.startRerolling) {
        sessionManager.startRerolling()
      }

      rerollingDice.value = new Set(rerollingDice.value).add(rerollKey)
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
          const newSet = new Set(rerollingDice.value)
          newSet.delete(rerollKey)
          rerollingDice.value = newSet
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

    if (!rerollingDice.value.has(rerollKey)) {
      rerollingDice.value = new Set(rerollingDice.value).add(rerollKey)
      
      if (sessionManager?.startRerolling) {
        sessionManager.startRerolling()
      }
    }

    targetDie.previousValue = targetDie.dieRollValue

    const originalDieSize = targetDie.die.dieSize
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
        const newSet = new Set(rerollingDice.value)
        newSet.delete(rerollKey)
        rerollingDice.value = newSet
        delete targetDie.previousValue

        if (sessionManager?.stopRerolling) {
          sessionManager.stopRerolling()
        }
      })
    }, animationDuration)
  }

  // ==================== METHODS - OPPONENT DICE ====================
  
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

  // ==================== RETURN ====================
  
  return {
    // Constants
    DICE_ROLL_DURATION,
    
    // Refs - committed state
    committedDice,
    
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
    rerollingDice,
    
    // Calculations (used by EngagementRollModal)
    getSortedDice,
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
    getWinCounts
  }
}
