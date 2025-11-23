import CharacterService from '@/services/entities/characterService'
import { buildDiceSet, processDiceResults, getFavoredStatus, getDiceEmoji } from '@/utils/diceUtils'
import { getDiceFontClass, getDiceFontMaxClass } from '@/utils/diceFontUtils'

/**
 * Composable for managing skill dice interactions
 * Handles dice state calculations and click handlers
 */
export function useSkillDice(character, updateCallback) {
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
    const status = getFavoredStatus(skill)
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

    CharacterService.updateFavoredStatus(updatedCharacter)
    updateCallback(updatedCharacter)
  }

  const buildDiceSetForSkill = (skillConfig, options = {}) => {
    return buildDiceSet(skillConfig, options)
  }

  const getEmojiForDie = (die, roll) => {
    return getDiceEmoji(die, roll)
  }

  const processDiceResultsForCharacter = (rollResults, characterId, getDiceFontClass) => {
    return processDiceResults(rollResults, characterId, getDiceFontClass)
  }

  // Sort skill check dice according to standard rules (includes dropped dice)
  const sortSkillCheckDice = (diceArray, rollResults) => {
    if (!diceArray || !Array.isArray(diceArray) || diceArray.length === 0) {
      return []
    }

    const diceWithResults = diceArray.map((die, index) => {
      if (!rollResults) {
        // No results yet - show rolling state
        return {
          dieSides: die,
          dieRollValue: die,
          cssClass: getDiceFontMaxClass(die),
          isRolling: true,
          rolledMaxValue: false,
          poolIndex: index,
          isDropped: false
        }
      } else {
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
    buildDiceSet: buildDiceSetForSkill,
    getEmojiForDie,
    processDiceResults: processDiceResultsForCharacter,
    sortSkillCheckDice
  }
}
