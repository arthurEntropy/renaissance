import { ref, reactive, computed } from 'vue'
import { DiceStatus } from '@/constants/diceStatus'

/**
 * Composable for managing basic engagement dice state
 * Handles dice collections, status management, and basic reactive state
 */
export function useEngagementDiceState(character = null, allEquipment = null) {
  // Core state
  const diceStatuses = reactive({})
  const manualResults = ref([])
  
  // Sorting state
  const initialSortDone = ref(false)
  const sortedOrder = ref(null)
  const opponentInitialSortDone = ref(false)
  const opponentSortedOrder = ref(null)

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
        name: '(added manually)', // Label for user-added dice in tooltips
        userAddedIndex: index,
        statusKey,
        status,
        isUserAdded: true
      }
    })
  })

  // All engagement dice available to the character
  const allEngagementDice = computed(() => {
    const allDice = [
      ...equipmentEngagementDice.value,
      ...userAddedEngagementDice.value
    ]

    // Sort by die size
    return allDice.sort((a, b) => a.die - b.die)
  })

  // Dice status helpers
  const hasSelectedDice = computed(() => {
    return Object.values(diceStatuses).includes(DiceStatus.SELECTED)
  })

  const selectedDiceValues = computed(() => {
    return allEngagementDice.value
      .filter(item => item.status === DiceStatus.SELECTED)
      .map(item => ({ dieSides: item.die }))
  })

  const hasExpendedDice = computed(() => {
    return Object.values(diceStatuses).includes(DiceStatus.EXPENDED)
  })

  // Dice status management methods
  function toggleDiceStatus(diceInfo) {
    // Cycle through states: available -> selected -> expended -> available
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

    // Clear all dice statuses - available is default status
    Object.keys(diceStatuses).forEach(key => delete diceStatuses[key])
  }

  function markSelectedDiceAsExpended() {
    Object.keys(diceStatuses).forEach(key => {
      if (diceStatuses[key] === DiceStatus.SELECTED) {
        diceStatuses[key] = DiceStatus.EXPENDED
      }
    })
  }

  // Character data update methods
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

  function resetDiceState() {
    manualResults.value = []
    Object.keys(diceStatuses).forEach(key => delete diceStatuses[key])
    initialSortDone.value = false
    sortedOrder.value = null
    opponentInitialSortDone.value = false
    opponentSortedOrder.value = null
  }

  return {
    // State
    diceStatuses,
    manualResults,
    initialSortDone,
    sortedOrder,
    opponentInitialSortDone,
    opponentSortedOrder,

    // Computed properties
    equipmentEngagementDice,
    userAddedEngagementDice,
    allOwnedEngagementDice: allEngagementDice,
    hasSelectedDice,
    selectedDiceValues,
    hasExpendedDice,

    // Methods
    toggleDiceStatus,
    resetDice,
    markSelectedDiceAsExpended,
    addUserAddedDie,
    removeUserAddedDie,
    resetSortingState,
    resetDiceState
  }
}
