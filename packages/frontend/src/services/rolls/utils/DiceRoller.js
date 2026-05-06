/**
 * @typedef {import('@shared/types/dice.js').DieSize} DieSize
 * @typedef {import('@shared/types/dice.js').Die} Die
 */

class DiceRoller {
  
  static rollDie(sides) {
    return Math.floor(Math.random() * sides) + 1 // Random int between 1 and sides
  }

  static rollPool(dicePool) {
    return dicePool.map((die, index) => 
      this.createDiceResult(die.dieSides, this.rollDie(die.dieSides), index)
    )
  }

  static createDiceResult(dieSides, rolledValue, poolIndex) {
    const rolledMaxValue = rolledValue === dieSides
    
    return {
      // Core identity
      dieSides,
      dieRollValue: rolledValue,
      poolIndex,
      
      // State tracking
      originalDieRollValue: rolledValue,
      isDropped: false, // Default to not dropped
      rolledMaxValue,
      
      // Display data
      displayValue: rolledValue,
      cssClass: null, // Default to no CSS class
      emoji: null // Default to no emoji
    }
  }
}

export default DiceRoller
