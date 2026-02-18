import { getDiceFontClass } from '@/utils/diceFontUtils'
import { RollTypes } from '@/constants/rollTypes'
import { DIE_TYPE, SPECIAL_ROLLS, EMOJI } from '@shared/constants/dice.js'

class DiceFormatter {

  static getDiceEmoji(dieSides, dieRollValue, rolledMaxValue = false, rollType = null) {
    // Check for Sol/Morte on d12s for feat-die based roll types
    const isFeatDieType = rollType === RollTypes.SKILL_CHECK ||
      rollType === RollTypes.OPPOSED_SKILL_CHECK ||
      rollType === RollTypes.INJURY
    
    if (dieSides === DIE_TYPE.D12 && isFeatDieType) {
      if (dieRollValue === SPECIAL_ROLLS.SOL) return EMOJI.SOL
      if (dieRollValue === SPECIAL_ROLLS.MORTE) return EMOJI.MORTE
    } else if (dieSides === DIE_TYPE.D6 && dieRollValue === SPECIAL_ROLLS.SUCCESS) {
      return EMOJI.SUCCESS
    } else if (rolledMaxValue && dieRollValue === dieSides) {
      // For any die that rolled max value (engagement dice, initiative, etc.)
      return EMOJI.SUCCESS
    }
    return null
  }

  static createMaxValueDiceResult(diceArray, rollType) {
    if (!diceArray || diceArray.length === 0) {
      return []
    }

    const rollingDice = diceArray.map((die, index) => ({
      dieSides: die.dieSides,
      dieRollValue: die.dieSides, // Max possible value for this die
      cssClass: getDiceFontClass(die.dieSides, die.dieSides),
      isRolling: true,
      rolledMaxValue: false,
      poolIndex: index,
      isDropped: false
    }))

    return this.sortByRollType(rollingDice, rollType)
  }

  static addDisplayData(diceResults, rollType = null) {
    return diceResults.map(result => {
      // For dropped dice, display the original value
      const valueToDisplay = result.isDropped 
        ? result.originalDieRollValue 
        : result.dieRollValue
      
      result.displayValue = valueToDisplay
      result.cssClass = getDiceFontClass(result.dieSides, valueToDisplay)
      result.emoji = this.getDiceEmoji(result.dieSides, valueToDisplay, result.rolledMaxValue, rollType)
      
      return result
    })
  }

  static sortByRollType(diceResults, rollType) {
    switch (rollType) {
      case RollTypes.SKILL_CHECK:
      case RollTypes.OPPOSED_SKILL_CHECK:
      case RollTypes.INJURY:
        return this.sortForSkillCheck(diceResults)
      case RollTypes.ENGAGEMENT:
        return this.sortForEngagement(diceResults)
      case RollTypes.CUSTOM_ROLL:
      default:
        // No sorting needed - preserve original pool order
        return diceResults
    }
  }

  static sortForSkillCheck(diceResults) {
    return [...diceResults].sort((a, b) => {
      // First, sort by die type (d12s before d6s)
      if (a.dieSides !== b.dieSides) {
        return b.dieSides - a.dieSides
      }
      
      // Within same die type, dropped dice go to end
      if (a.isDropped !== b.isDropped) {
        return a.isDropped ? 1 : -1
      }
      
      // If both dropped or both not dropped, sort by value (highest first)
      if (a.dieRollValue !== b.dieRollValue) {
        return b.dieRollValue - a.dieRollValue
      }
      
      // If same type and value, maintain original pool order
      if (a.poolIndex === undefined || b.poolIndex === undefined) {
        console.warn('DiceResult missing poolIndex during sort', { a, b })
        return 0
      }
      return a.poolIndex - b.poolIndex
    })
  }

  static sortForEngagement(diceResults) {
    return [...diceResults].sort((a, b) => {
      // Sort by value first (highest first)
      if (a.dieRollValue !== b.dieRollValue) {
        return b.dieRollValue - a.dieRollValue
      }
      
      // If same value, larger die wins
      if (a.dieSides !== b.dieSides) {
        return b.dieSides - a.dieSides
      }
      
      // If same value and size, maintain pool order
      if (a.poolIndex === undefined || b.poolIndex === undefined) {
        console.warn('DiceResult missing poolIndex during sort', { a, b })
        return 0
      }
      return a.poolIndex - b.poolIndex
    })
  }
}

export default DiceFormatter
