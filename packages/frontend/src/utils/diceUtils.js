import { getDiceFontClass, getDiceFontMaxClass } from '@shared/utils/diceFontUtils'

export function rollSingleDie(dieSize) {
  return Math.floor(Math.random() * dieSize) + 1
}

export function getDiceEmoji(dieSize, roll) {
  if (dieSize === 12) {
    if (roll === 12) return '🌞'
    if (roll === 11) return '💀'
  } else if (dieSize === 6 && roll === 6) {
    return '✨'
  }
  return null
}

export function getEmojiForDieResult(result) {
  // Extract emoji from backend symbol if available
  if (result.symbol) {
    if (result.symbol.includes('💀')) return '💀'
    if (result.symbol.includes('🌞')) return '🌞'
    if (result.symbol.includes('✨')) return '✨'
  }

  // Fallback: generate emoji based on die type and roll value
  const rollValue = result.roll === 0 ? result.originalRoll : result.roll
  return getDiceEmoji(result.die, rollValue)
}

export function formatDiceResults(rollResults) {
  return rollResults.map(result => ({
    type: result.die,
    value: result.roll,
    displayValue: result.roll === 0 ? result.originalRoll : result.roll,
    symbol: result.symbol,
    isMaxValue: result.die === result.roll && result.roll > 0,
    dropped: result.roll === 0,
    class: getDiceFontClass(result.die, result.roll === 0 ? result.originalRoll : result.roll),
    emoji: getDiceEmoji(result.die, result.roll === 0 ? result.originalRoll : result.roll)
  }))
}

export function processDiceResults(rollResults, characterId, getDiceFontClass = null) {
  if (!rollResults?.session) {
    return []
  }

  const userSession = rollResults.session.users.find(u =>
    u.characterInfo.id === characterId
  )

  if (!userSession?.rollResults) return []

  return userSession.rollResults.map((result, index) => ({
    type: result.die,
    value: result.roll === 0 ? result.originalRoll : result.roll,
    displayValue: result.roll === 0 ? result.originalRoll : result.roll,
    dropped: result.roll === 0,
    isMaxValue: result.die === result.roll && result.roll > 0,
    originalIndex: index,
    emoji: getEmojiForDieResult(result),
    class: getDiceFontClass 
      ? getDiceFontClass(result.die, result.roll === 0 ? result.originalRoll : result.roll)
      : getDiceFontClass(result.die, result.roll === 0 ? result.originalRoll : result.roll)
  })).sort((a, b) => {
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
    const die = { type: 12, category: 'd12' }
    if (includeDiceClass && getDiceFontMaxClass) {
      die.diceClass = getDiceFontMaxClass(12)
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
      type: 6,
      category: 'd6',
      isSubtracted,
      isAdded: false
    }
    
    if (includeDiceClass && getDiceFontMaxClass) {
      die.diceClass = getDiceFontMaxClass(6)
    }
    
    dice.push(die)
  }
  
  // Add dice for positive dice mod (capped to prevent excessive dice)
  if (diceMod > 0) {
    const maxAdditionalDice = Math.min(diceMod, 5 - baseRanks)
    for (let i = 0; i < maxAdditionalDice; i++) {
      const die = {
        type: 6,
        category: 'd6',
        isSubtracted: false,
        isAdded: true
      }
      
      if (includeDiceClass && getDiceFontMaxClass) {
        die.diceClass = getDiceFontMaxClass(6)
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

export default {
  rollSingleDie,
  getDiceEmoji,
  getEmojiForDieResult,
  formatDiceResults,
  processDiceResults,
  buildDiceSet,
  getFavoredStatus
}
