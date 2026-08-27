import { DIE_TYPE, SPECIAL_ROLLS, TWICE_WEARY_THRESHOLD } from '@shared/constants/dice.js'

class DiceProcessor {

  static applyFavoredOrIllFavored(diceResults, isFavored) {
    // Get all d12 results
    const d12Results = diceResults.filter(result => result.die.dieSize === DIE_TYPE.D12)
    
    if (d12Results.length < 2) {
      return diceResults // Need at least 2 d12s to process favored/ill-favored rules
    }
    
    // Extract d12 roll values
    const d12Rolls = d12Results.map(result => result.dieRollValue)
    
    // Find target value (highest for favored, lowest for ill-favored)
    let targetValue
    if (isFavored) {
      // Find highest, treating Morte as lowest
      targetValue = d12Rolls.reduce((max, roll) => {
        if (roll === SPECIAL_ROLLS.MORTE) return max
        return max === SPECIAL_ROLLS.MORTE || roll > max ? roll : max
      }, SPECIAL_ROLLS.MORTE)
    } else {
      // Find lowest, Morte is always lowest
      targetValue = d12Rolls.includes(SPECIAL_ROLLS.MORTE) 
        ? SPECIAL_ROLLS.MORTE 
        : Math.min(...d12Rolls)
    }
    
    // If both d12s tied for highest or lowest, just keep the first one
    let keptOne = false
    d12Results.forEach(result => {
      if (result.dieRollValue === targetValue && !keptOne) {
        keptOne = true // Keep this one
      } else {
        this.markAsDropped(result) // Drop all others
      }
    })
    
    return diceResults
  }

  static markAsDropped(diceResult) {
    if (!diceResult.originalDieRollValue) {
      diceResult.originalDieRollValue = diceResult.dieRollValue
    }
    diceResult.dieRollValue = 0
    diceResult.isDropped = true
    diceResult.displayValue = diceResult.originalDieRollValue
  }

  static markMaxValueDice(diceResults) {
    diceResults.forEach(result => {
      result.rolledMaxValue = result.die.dieSize === result.dieRollValue && !result.isDropped
    })
    return diceResults
  }

  static calculateTotal(diceResults, twiceWearyFilter = false, applyFateDieRules = true) {
    return diceResults.reduce((sum, result) => {
      // Always exclude dropped dice
      if (result.isDropped) {
        return sum
      }
      
      // Exclude Morte on d12s only for feat-die roll types (skill checks, initiative, etc.)
      if (applyFateDieRules && result.die.dieSize === DIE_TYPE.D12 && result.dieRollValue === SPECIAL_ROLLS.MORTE) {
        return sum
      }
      
      // Apply Twice Weary filter if enabled (d6 rolls of 1-3 don't count)
      if (twiceWearyFilter && result.die.dieSize === DIE_TYPE.D6 && result.dieRollValue <= TWICE_WEARY_THRESHOLD) {
        return sum
      }
      
      return sum + result.dieRollValue
    }, 0)
  }

  // If a character is Twice Miserable, they automatically fail a skill check if they roll Morte on their d12.
  static checkAutoFail(diceResults, isTwiceMiserable, isFavored) {
    if (!isTwiceMiserable) {
      return false
    }
    
    const d12Rolls = diceResults
      .filter(result => result.die.dieSize === DIE_TYPE.D12)
      .map(result => result.dieRollValue)
    
    if (isFavored) {
      // Favored: need TWO Mortes for auto-fail
      return d12Rolls.filter(roll => roll === SPECIAL_ROLLS.MORTE).length === 2
    } else {
      // Normal or ill-favored: any Morte is auto-fail
      return d12Rolls.includes(SPECIAL_ROLLS.MORTE)
    }
  }
}

export default DiceProcessor
