import { getDiceFontClass } from '@/utils/diceFontUtils'
import { DIE_TYPE, SPECIAL_ROLLS, EMOJI } from '../../../../shared/constants/dice.js'

export function rollSingleDie(dieSides) {
  return Math.floor(Math.random() * dieSides) + 1
}

export function getDiceEmoji(dieSides, dieRollValue) {
  if (dieSides === DIE_TYPE.D12) {
    if (dieRollValue === SPECIAL_ROLLS.SOL) return EMOJI.SOL
    if (dieRollValue === SPECIAL_ROLLS.MORTE) return EMOJI.MORTE
  } else if (dieSides === DIE_TYPE.D6 && dieRollValue === SPECIAL_ROLLS.SUCCESS) {
    return EMOJI.SUCCESS
  }
  return null
}

function getDisplayDieRollValue(result) {
  return result.dieRollValue === 0 ? result.originalDieRollValue : result.dieRollValue
}

export function formatDiceResults(rollResults) {
  return rollResults.map(result => {
    const displayDieRollValue = getDisplayDieRollValue(result)
    return {
      dieSides: result.dieSides,
      dieRollValue: result.dieRollValue,
      displayDieRollValue,
      rolledMaxValue: result.dieSides === result.dieRollValue && result.dieRollValue > 0,
      isDropped: result.dieRollValue === 0,
      cssClass: getDiceFontClass(result.dieSides, displayDieRollValue),
      emoji: getDiceEmoji(result.dieSides, displayDieRollValue)
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
    const displayDieRollValue = getDisplayDieRollValue(result)
    return {
      dieSides: result.dieSides,
      dieRollValue: displayDieRollValue,
      displayDieRollValue,
      isDropped: result.dieRollValue === 0,
      rolledMaxValue: result.dieSides === result.dieRollValue && result.dieRollValue > 0,
      poolIndex: index,
      emoji: getDiceEmoji(result.dieSides, displayDieRollValue),
      cssClass: fontClassFn(result.dieSides, displayDieRollValue)
    }
  }).sort((a, b) => {
    // First, sort by die type (d12s first, then d6s)
    if (a.dieSides !== b.dieSides) {
      return b.dieSides - a.dieSides
    }

    // Within same die type, sort by value (highest first), but dropped dice go to end
    if (a.isDropped && !b.isDropped) return 1
    if (!a.isDropped && b.isDropped) return -1
    if (a.isDropped && b.isDropped) return 0

    if (b.dieRollValue !== a.dieRollValue) {
      return b.dieRollValue - a.dieRollValue
    }

    // If same type and value, maintain original order
    return a.poolIndex - b.poolIndex
  })
}

export function buildDiceSet(skillConfig, options = {}) {
  if (!skillConfig) return []
  
  const { includeDiceClass = false, getDiceFontMaxClass = null } = options
  const dice = []
  
  // Add d12 dice (1 for flat, 2 for favored/ill-favored)
  const d12Count = skillConfig.isFavored || skillConfig.isIllFavored ? 2 : 1
  for (let i = 0; i < d12Count; i++) {
    const die = { dieSides: DIE_TYPE.D12 }
    if (includeDiceClass && getDiceFontMaxClass) {
      die.cssClass = getDiceFontMaxClass(DIE_TYPE.D12)
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
      dieSides: DIE_TYPE.D6,
      isSubtracted,
      isAdded: false
    }
    
    if (includeDiceClass && getDiceFontMaxClass) {
      die.cssClass = getDiceFontMaxClass(DIE_TYPE.D6)
    }
    
    dice.push(die)
  }
  
  // Add dice for positive dice mod (capped to prevent excessive dice)
  if (diceMod > 0) {
    const MAX_RANKS = 5
    const maxAdditionalDice = Math.min(diceMod, MAX_RANKS - baseRanks)
    for (let i = 0; i < maxAdditionalDice; i++) {
      const die = {
        dieSides: DIE_TYPE.D6,
        isSubtracted: false,
        isAdded: true
      }
      
      if (includeDiceClass && getDiceFontMaxClass) {
        die.cssClass = getDiceFontMaxClass(DIE_TYPE.D6)
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
