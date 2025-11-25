import * as CharacterUtils from '@shared/types/entities/characterUtils'
import { getDiceFontClass } from '@/utils/diceFontUtils'
import BaseRollService from '@/services/rolls/baseRollService'
import { RollTypes } from '@/constants/rollTypes'
import { DIE_TYPE } from '@shared/constants/dice.js'
import { MAX_SKILL_RANKS } from '@shared/constants/characterConstants'

/**
 * Composable for managing skill dice interactions
 * Handles dice state calculations and click handlers
 */
export function useSkillDice(character, updateCallback) {
  // Build dice set for skill row with optional styling metadata
  const buildDiceSetForSkillRow = (skillConfig, options = {}) => {
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
    
    // Add dice for positive dice mod, up to max ranks
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

  // Determine if the rank is active (either from base ranks or positive dice mod)
  const isRankActive = (skill, diceIndex) => {
    return isCheckboxChecked(skill, diceIndex)
  }

  // Determine if this die is added by a positive dice mod
  const isDiceAdded = (skill, diceIndex) => {
    return (
      diceIndex >= skill.ranks &&
      diceIndex < skill.ranks + skill.diceMod &&
      skill.diceMod > 0
    )
  }

  // Determine if this die is subtracted by a negative dice mod
  const isDiceSubtracted = (skill, diceIndex) => {
    return (
      skill.ranks - diceIndex <= Math.abs(skill.diceMod) &&
      skill.diceMod < 0 &&
      diceIndex < skill.ranks
    )
  }

  const isCheckboxChecked = (skill, checkboxIndex) => {
    const withinRanks = checkboxIndex < skill.ranks
    const withinDiceMod =
      checkboxIndex >= skill.ranks &&
      checkboxIndex < skill.ranks + skill.diceMod &&
      skill.diceMod > 0
    return withinRanks || withinDiceMod
  }

  const getStyleClassForFavoredStatus = (skill) => {
    const status = BaseRollService.getFavoredStatus(skill)
    return status || ''
  }

  const handleDiceClick = (skillName, diceIndex) => {
    // Create immutable update instead of mutating original
    const updatedCharacter = {
      ...character.value,
      skills: character.value.skills.map(skill => {
        if (skill.name === skillName) {
          const newRank = diceIndex + 1
          const updatedRanks = newRank === skill.ranks ? skill.ranks - 1 : newRank
          return { ...skill, ranks: updatedRanks }
        }
        return skill
      })
    }

    CharacterUtils.updateFavoredStatus(updatedCharacter)
    updateCallback(updatedCharacter)
  }

  // Sort skill check dice according to standard rules (includes dropped dice)
  const sortSkillCheckDice = (diceArray, rollResults) => {
    if (!diceArray || !Array.isArray(diceArray) || diceArray.length === 0) {
      return []
    }

    if (!rollResults) {
      // No results yet - create max value placeholders
      const diceObjects = diceArray.map(dieSides => ({ dieSides }))
      return BaseRollService.createMaxValueDiceResult(diceObjects, RollTypes.SKILL_CHECK)
    }

    const diceWithResults = diceArray.map((die, index) => {
      // Handle complex format with potential drops for skill checks
      let value, isDropped = false
      
      if (rollResults[index] && typeof rollResults[index] === 'object') {
        const result = rollResults[index]
        value = result.dieRollValue
        isDropped = value === 0
        // For display, show original roll if dropped
        value = isDropped ? result.originalDieRollValue : value
      } else {
        // Simple number result
        value = rollResults[index] || 1
      }
      
      const rolledMaxValue = value === die && value > 0 && !isDropped
      
      return {
        dieSides: die,
        dieRollValue: value,
        displayDieRollValue: value,
        cssClass: getDiceFontClass(die, value),
        isRolling: false,
        rolledMaxValue: rolledMaxValue,
        poolIndex: index,
        isDropped: isDropped
      }
    })

    // Include dropped dice for skill checks
    // Sort by die type first (d12s first), then by value (highest first)
    return diceWithResults.sort((a, b) => {
      // First sort by die type (d12s before d6s)
      if (a.dieSides !== b.dieSides) {
        return b.dieSides - a.dieSides
      }
      // Then sort by value (highest first)
      return b.dieRollValue - a.dieRollValue
    })
  }

  return {
    isRankActive,
    isDiceAdded,
    isDiceSubtracted,
    getStyleClassForFavoredStatus,
    handleDiceClick,
    buildDiceSet: buildDiceSetForSkillRow,
    sortSkillCheckDice
  }
}
