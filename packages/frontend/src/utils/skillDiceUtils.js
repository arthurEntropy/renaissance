import { DIE_TYPE } from '@shared/constants/dice.js'
import { MAX_SKILL_RANKS } from '@shared/constants/characterConstants'

/** @typedef {import('@/types/rollPreviewTypes.js').SkillPreviewDie} SkillPreviewDie */

// Add d12 dice based on favored status (1 for flat, 2 for favored/ill-favored)
/** @returns {SkillPreviewDie[]} */
const buildD12Dice = (skillConfig) => {
  const dice = []
  const d12Count = skillConfig.isFavored || skillConfig.isIllFavored ? 2 : 1
  
  for (let i = 0; i < d12Count; i++) {
    dice.push({ dieSize: DIE_TYPE.D12 })
  }
  
  return dice
}

// Add d6 dice for base skill ranks (accounting for negative dice mod)
/** @returns {SkillPreviewDie[]} */
const buildBaseRankDice = (baseRanks, diceMod) => {
  const dice = []
  
  for (let i = 0; i < baseRanks; i++) {
    const isSubtracted = diceMod < 0 && i >= baseRanks + diceMod
    
    const die = {
      dieSize: DIE_TYPE.D6,
      isSubtracted,
      isAdded: false
    }
    
    dice.push(die)
  }
  
  return dice
}

// Add d6 dice for positive dice mod (up to max ranks)
/** @returns {SkillPreviewDie[]} */
const buildDiceModDice = (baseRanks, diceMod) => {
  const dice = []
  
  if (diceMod > 0) {
    const maxAdditionalDice = Math.min(diceMod, MAX_SKILL_RANKS - baseRanks)
    for (let i = 0; i < maxAdditionalDice; i++) {
      const die = {
        dieSize: DIE_TYPE.D6,
        isSubtracted: false,
        isAdded: true
      }
      
      dice.push(die)
    }
  }
  
  return dice
}

/** @returns {SkillPreviewDie[]} */
export const buildDiceSetForSkill = (skillConfig, options = {}) => {
  if (!skillConfig) return []
  
  const baseRanks = skillConfig.ranks || 0
  const diceMod = skillConfig.diceMod || 0
  
  const dice = [
    ...buildD12Dice(skillConfig),
    ...buildBaseRankDice(baseRanks, diceMod),
    ...buildDiceModDice(baseRanks, diceMod)
  ]

  if (options.includeDiceClass && options.getDiceFontMaxClass) {
    dice.forEach(die => {
      die.cssClass = options.getDiceFontMaxClass(die.dieSize)
    })
  }

  return dice
}
