import {
  BASE_ENDURANCE_MULTIPLIER,
  BASE_HOPE_MULTIPLIER,
  BASE_DEFENSE_MINIMUM,
  CONDITIONS,
  STATES,
  CONDITION_AND_STATE_DICE_MODIFIER,
} from '../constants/characterConstants.js'

// ========================================
// STAT CALCULATIONS
// ========================================

export function calculatebaseEndurance(body) {
  return body * BASE_ENDURANCE_MULTIPLIER
}

export function calculatebaseHope(heart) {
  return heart * BASE_HOPE_MULTIPLIER
}

export function calculatebaseDefense(wits) {
  return wits + BASE_DEFENSE_MINIMUM
}

export function getTotalWeightCarried(character, allEquipment) {
  if (!Array.isArray(allEquipment) || !character?.equipment) {
    return 0
  }

  return character.equipment.reduce((sum, item) => {
    const equipment = allEquipment.find((eq) => eq.id === item.id)
    return item.isCarried && equipment
      ? sum + equipment.weight * item.quantity
      : sum
  }, 0)
}

export function calculateLoad(character, allEquipment) {
  const totalWeight = getTotalWeightCarried(character, allEquipment)
  const baseEndurance = character.endurance?.base || 0
  const body = character.body || 0
  
  return Math.max(0, totalWeight - baseEndurance - body)
}

// ========================================
// STATE CALCULATIONS
// ========================================

export function calculateWearyStates(character) {
  const load = character.load || 0
  const currentEndurance = character.endurance?.current || 0
  const baseEndurance = character.endurance?.base || 0

  const weary = load > currentEndurance
  const twiceWeary = load > baseEndurance && weary

  return { weary, twiceWeary }
}

export function calculateMiserableStates(character) {
  const shadow = character.shadow || 0
  const currentHope = character.hope?.current || 0
  const baseHope = character.hope?.base || 0

  const miserable = shadow > currentHope
  const twiceMiserable = shadow > baseHope && miserable

  return { miserable, twiceMiserable }
}

export function calculateHelplessStates(character) {
  const injury = character.injury || 0
  const currentDefense = character.defense?.current || 0
  const baseDefense = character.defense?.base || 0

  const helpless = injury > currentDefense
  const twiceHelpless = injury > baseDefense && helpless

  return { helpless, twiceHelpless }
}

export function updateAllStates(character) {
  Object.assign(character.states, calculateWearyStates(character))
  Object.assign(character.states, calculateMiserableStates(character))
  Object.assign(character.states, calculateHelplessStates(character))
}

// ========================================
// DICE MODIFIERS AND FAVORED STATUS
// ========================================

export function updateDiceMods(character) {
  if (!character?.skills) return

  character.skills.forEach((skill) => {
    // Reset to 0
    skill.diceMod = 0

    // Apply mods from conditions
    if (character.conditions) {
      Object.entries(character.conditions).forEach(([conditionKey, isActive]) => {
        if (!isActive) {
          return
        }

        const conditionObj = Object.values(CONDITIONS).find((condition) => condition.key === conditionKey)
        if (
          conditionObj &&
          conditionObj.affectedSkills?.some((affectedSkill) => affectedSkill.key === skill.key)
        ) {
          skill.diceMod += CONDITION_AND_STATE_DICE_MODIFIER
        }
      })
    }

    // Apply mods from states
    if (character.states) {
      Object.entries(character.states).forEach(([stateKey, isActive]) => {
        if (!isActive) {
          return
        }

        const stateObj = Object.values(STATES).find((state) => state.key === stateKey)
        if (
          stateObj &&
          'affectedSkills' in stateObj &&
          stateObj.affectedSkills.some((affectedSkill) => affectedSkill.key === skill.key)
        ) {
          skill.diceMod += CONDITION_AND_STATE_DICE_MODIFIER
        }
      })
    }
  })
}

export function updateFavoredStatus(character) {
  if (!character?.skills) return

  character.skills.forEach((skill) => {
    // Check if ill-favored based on ranks + diceMod + manualDiceMod
    const totalDiceMod = (skill.diceMod || 0) + (skill.manualDiceMod || 0)
    skill.isIllFavored = (skill.ranks || 0) + totalDiceMod < 0

  })
}

// ========================================
// ORCHESTRATION FUNCTIONS (HANDLE CHANGES)
// ========================================

export function handleBodyChange(character, options = {}) {
  const { calcMax = true } = options
  if (calcMax) character.endurance.base = calculatebaseEndurance(character.body)
  Object.assign(character.states, calculateWearyStates(character))
  updateDiceMods(character)
  updateFavoredStatus(character)
}

export function handleHeartChange(character, options = {}) {
  const { calcMax = true } = options
  if (calcMax) character.hope.base = calculatebaseHope(character.heart)
  Object.assign(character.states, calculateMiserableStates(character))
  updateDiceMods(character)
  updateFavoredStatus(character)
}

export function handleWitsChange(character, options = {}) {
  const { calcMax = true } = options
  if (calcMax) character.defense.base = calculatebaseDefense(character.wits)
  Object.assign(character.states, calculateHelplessStates(character))
  updateDiceMods(character)
  updateFavoredStatus(character)
}

export function handleEnduranceChange(character, allEquipment) {
  character.load = calculateLoad(character, allEquipment)
  Object.assign(character.states, calculateWearyStates(character))
  updateDiceMods(character)
  updateFavoredStatus(character)
}

export function handleHopeChange(character) {
  Object.assign(character.states, calculateMiserableStates(character))
  updateDiceMods(character)
  updateFavoredStatus(character)
}

export function handleDefenseChange(character) {
  Object.assign(character.states, calculateHelplessStates(character))
  updateDiceMods(character)
  updateFavoredStatus(character)
}

export function handleLoadChange(character) {
  Object.assign(character.states, calculateWearyStates(character))
  updateDiceMods(character)
  updateFavoredStatus(character)
}

export function handleShadowChange(character) {
  Object.assign(character.states, calculateMiserableStates(character))
  updateDiceMods(character)
  updateFavoredStatus(character)
}

export function handleInjuryChange(character) {
  Object.assign(character.states, calculateHelplessStates(character))
  updateDiceMods(character)
  updateFavoredStatus(character)
}

export function handleStatesChange(character) {
  updateDiceMods(character)
  updateFavoredStatus(character)
}

export function handleConditionsChange(character) {
  updateDiceMods(character)
  updateFavoredStatus(character)
}

export function handleEquipmentChange(character, allEquipment) {
  character.load = calculateLoad(character, allEquipment)
}

// ========================================
// EQUIPMENT MANIPULATION
// ========================================

export function findMaxEquipmentIndex(character) {
  if (!character?.equipment) return -1
  
  return character.equipment.reduce(
    (max, item) =>
      item.index !== undefined && item.index > max ? item.index : max,
    -1
  )
}

export function addEquipmentItem(character, allEquipment) {
  if (!character?.equipment) {
    character.equipment = []
  }

  const maxIndex = findMaxEquipmentIndex(character)

  character.equipment.push({
    id: '',
    quantity: 1,
    isCarried: true,
    collapsed: true,
    artExpanded: false,
    index: maxIndex + 1,
  })

  character.load = calculateLoad(character, allEquipment)
}

export function addSpecificEquipmentItem(character, equipmentItem, allEquipment) {
  if (!character?.equipment) {
    character.equipment = []
  }

  const maxIndex = findMaxEquipmentIndex(character)

  character.equipment.push({
    id: equipmentItem.id,
    quantity: equipmentItem.quantity || 1,
    isCarried: equipmentItem.isCarried !== undefined ? equipmentItem.isCarried : true,
    isWielding: equipmentItem.isWielding || false,
    index: maxIndex + 1,
    collapsed: equipmentItem.collapsed !== undefined ? equipmentItem.collapsed : true,
    artExpanded: equipmentItem.artExpanded !== undefined ? equipmentItem.artExpanded : false,
  })

  if (allEquipment) {
    character.load = calculateLoad(character, allEquipment)
  }
}

export function removeEquipmentItem(character, index, allEquipment) {
  if (!character?.equipment || index < 0 || index >= character.equipment.length) {
    return
  }

  character.equipment.splice(index, 1)
  
  if (allEquipment) {
    character.load = calculateLoad(character, allEquipment)
  }
}

export function updateEquipmentItem(character, index, key, value, allEquipment) {
  if (!character?.equipment || index < 0 || index >= character.equipment.length) {
    return
  }

  character.equipment[index][key] = value

  if ((key === 'weight' || key === 'quantity' || key === 'isCarried') && allEquipment) {
    character.load = calculateLoad(character, allEquipment)
  }
}
