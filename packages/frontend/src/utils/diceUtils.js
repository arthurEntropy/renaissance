import { getDiceFontClass } from '@/utils/diceFontUtils'
import { DIE_TYPE, SPECIAL_ROLLS, EMOJI } from '../../../../shared/constants/dice.js'

export function rollSingleDie(dieType) {
  return Math.floor(Math.random() * dieType) + 1
}

export function getDiceEmoji(dieType, dieRoll) {
  if (dieType === DIE_TYPE.D12) {
    if (dieRoll === SPECIAL_ROLLS.SOL) return EMOJI.SOL
    if (dieRoll === SPECIAL_ROLLS.MORTE) return EMOJI.MORTE
  } else if (dieType === DIE_TYPE.D6 && dieRoll === SPECIAL_ROLLS.SUCCESS) {
    return EMOJI.SUCCESS
  }
  return null
}

function getDisplayValue(result) {
  return result.roll === 0 ? result.originalRoll : result.roll
}

export function formatDiceResults(rollResults) {
  return rollResults.map(result => {
    const displayValue = getDisplayValue(result)
    return {
      type: result.die,
      value: result.roll,
      displayValue,
      isMaxValue: result.die === result.roll && result.roll > 0,
      dropped: result.roll === 0,
      class: getDiceFontClass(result.die, displayValue),
      emoji: getDiceEmoji(result.die, displayValue)
    }
  })
}

export function processDiceResults(rollResults, characterId, getDiceFontClassFn = null) {
  if (!rollResults?.session) {
    return []
  }

  const userSession = rollResults.session.users.find(u =>
    u.characterInfo.id === characterId
  )

  if (!userSession?.rollResults) return []

  const fontClassFn = getDiceFontClassFn || getDiceFontClass

  return userSession.rollResults.map((result, index) => {
    const displayValue = getDisplayValue(result)
    return {
      type: result.die,
      value: displayValue,
      displayValue,
      dropped: result.roll === 0,
      isMaxValue: result.die === result.roll && result.roll > 0,
      originalIndex: index,
      emoji: getDiceEmoji(result.die, displayValue),
      class: fontClassFn(result.die, displayValue)
    }
  }).sort((a, b) => {
    // First, sort by die type (d12s first, then d6s)
    if (a.type !== b.type) {
      return b.type - a.type
    }

    // Within same die type, sort by value (highest first), but dropped dice go to end
    if (a.dropped && !b.dropped) return 1
    if (!a.dropped && b.dropped) return -1
    if (a.dropped && b.dropped) return 0

    if (b.value !== a.value) {
      return b.value - a.value
    }

    // If same type and value, maintain original order
    return a.originalIndex - b.originalIndex
  })
}

export function buildDiceSet(skillConfig, options = {}) {
  if (!skillConfig) return []
  
  const { includeDiceClass = false, getDiceFontMaxClass = null } = options
  const dice = []
  
  // Add d12 dice (1 for flat, 2 for favored/ill-favored)
  const d12Count = skillConfig.isFavored || skillConfig.isIllFavored ? 2 : 1
  for (let i = 0; i < d12Count; i++) {
    const die = { type: DIE_TYPE.D12 }
    if (includeDiceClass && getDiceFontMaxClass) {
      die.diceClass = getDiceFontMaxClass(DIE_TYPE.D12)
    }
    dice.push(die)
  }
  
  // Add d6 dice based on ranks and dice mod
  const baseRanks = skillConfig.ranks || 0
  const diceMod = skillConfig.diceMod || 0
  
  // Calculate dice for base ranks
  for (let i = 0; i < baseRanks; i++) {
    const isSubtracted = diceMod < 0 && i >= baseRanks + diceMod
    
    const die = {
      type: DIE_TYPE.D6,
      isSubtracted,
      isAdded: false
    }
    
    if (includeDiceClass && getDiceFontMaxClass) {
      die.diceClass = getDiceFontMaxClass(DIE_TYPE.D6)
    }
    
    dice.push(die)
  }
  
  // Add dice for positive dice mod (capped to prevent excessive dice)
  if (diceMod > 0) {
    const MAX_RANKS = 5
    const maxAdditionalDice = Math.min(diceMod, MAX_RANKS - baseRanks)
    for (let i = 0; i < maxAdditionalDice; i++) {
      const die = {
        type: DIE_TYPE.D6,
        isSubtracted: false,
        isAdded: true
      }
      
      if (includeDiceClass && getDiceFontMaxClass) {
        die.diceClass = getDiceFontMaxClass(DIE_TYPE.D6)
      }
      
      dice.push(die)
    }
  }
  
  return dice
}

export function getFavoredStatus(skillConfig) {
  if (skillConfig.isFavored) return 'favored'
  if (skillConfig.isIllFavored) return 'ill-favored'
  return null
}
