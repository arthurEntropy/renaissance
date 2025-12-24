import { DIE_TYPE } from '@shared/constants/dice.js'
import { MAX_SKILL_RANKS } from '@shared/constants/characterConstants'

// Add d12 dice based on favored status (1 for flat, 2 for favored/ill-favored)
const buildD12Dice = (skillConfig, options) => {
  const { includeDiceClass, getDiceFontMaxClass } = options
  const dice = []
  const d12Count = skillConfig.isFavored || skillConfig.isIllFavored ? 2 : 1
  
  for (let i = 0; i < d12Count; i++) {
    const die = { dieSides: DIE_TYPE.D12 }
    if (includeDiceClass && getDiceFontMaxClass) {
      die.cssClass = getDiceFontMaxClass(DIE_TYPE.D12)
    }
    dice.push(die)
  }
  
  return dice
}

// Add d6 dice for base skill ranks (accounting for negative dice mod)
const buildBaseRankDice = (baseRanks, diceMod, options) => {
  const { includeDiceClass, getDiceFontMaxClass } = options
  const dice = []
  
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
  
  return dice
}

// Add d6 dice for positive dice mod (up to max ranks)
const buildDiceModDice = (baseRanks, diceMod, options) => {
  const { includeDiceClass, getDiceFontMaxClass } = options
  const dice = []
  
  if (diceMod > 0) {
    const maxAdditionalDice = Math.min(diceMod, MAX_SKILL_RANKS - baseRanks)
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

export const buildDiceSetForSkill = (skillConfig, options = {}) => {
  if (!skillConfig) return []
  
  const baseRanks = skillConfig.ranks || 0
  const diceMod = skillConfig.diceMod || 0
  
  return [
    ...buildD12Dice(skillConfig, options),
    ...buildBaseRankDice(baseRanks, diceMod, options),
    ...buildDiceModDice(baseRanks, diceMod, options)
  ]
}
