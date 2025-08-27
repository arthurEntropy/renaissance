import axios from 'axios'
import { RollTypes } from '@/constants/rollTypes'
import { getDiceFontClass } from '@shared/utils/diceFontUtils'

class CustomRollService {
  static latestRollResult = null
  static apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  static getLatestRollResult() {
    return this.latestRollResult
  }

  static makeCustomRoll(dicePool, modifier, character) {
    // Prepare the dice pool and roll the dice
    const diceResults = this.rollDice(dicePool)
    
    // Calculate totals
    const diceTotal = this.calculateDiceTotal(diceResults)
    const finalTotal = diceTotal + modifier

    // Mark max value dice for display
    this.markSpecialDice(diceResults)

    // Create roll result object
    const rollResult = this.createCustomRollResult(
      dicePool,
      diceResults,
      modifier,
      diceTotal,
      finalTotal,
      character.name
    )

    // Store latest roll
    this.latestRollResult = rollResult

    // Send to Discord
    const rollResultsForDiscord = diceResults.map((r) => `${r.roll} (d${r.die})`).join(', ')
    this.sendCustomRollToServer(
      rollResultsForDiscord,
      diceTotal,
      modifier,
      finalTotal,
      character.name,
      character.artUrls[0]
    )

    return rollResult
  }

  static rollDice(dicePool) {
    return dicePool.map((die) => {
      const roll = Math.floor(Math.random() * die.sides) + 1
      return { die: die.sides, roll: roll }
    })
  }

  static calculateDiceTotal(diceResults) {
    return diceResults.reduce((sum, result) => sum + result.roll, 0)
  }

  static markSpecialDice(diceResults) {
    diceResults.forEach((result) => {
      result.isMaxValue = result.die === result.roll
      result.dropped = false // Custom rolls don't have dropped dice
    })
  }

  static createCustomRollResult(dicePool, diceResults, modifier, diceTotal, finalTotal, characterName) {
    return {
      type: RollTypes.CUSTOM_ROLL,
      characterName: characterName,
      skillName: 'Custom Roll', // For display consistency
      baseSkillName: 'Custom Roll',
      total: finalTotal,
      diceTotal: diceTotal,
      modifier: modifier,
      targetNumber: null, // Custom rolls don't have target numbers
      success: null, // Custom rolls don't have success/failure
      diceSymbols: [], // Not used for custom rolls
      diceResults: diceResults.map((result) => ({
        type: result.die, // Die size (4, 6, 8, 10, 12, 20)
        value: result.roll, // The actual number rolled
        symbol: '', // Not used for custom rolls
        isMaxValue: result.die === result.roll,
        emoji: null, // No emojis for custom rolls
        dropped: false, // Custom rolls don't drop dice
        displayValue: result.roll,
        class: getDiceFontClass(result.die, result.roll), // For in-app display using DiceFont
      })),
      favoredStatus: null, // Custom rolls don't have favored status
      footer: '', // No footer for custom rolls
      timestamp: Date.now(),
    }
  }

  static async sendCustomRollToServer(
    rollResults,
    diceTotal,
    modifier,
    finalTotal,
    characterName,
    image
  ) {
    try {
      await axios.post(`${this.apiUrl}/send-discord-message`, {
        rollResults: rollResults, // Already formatted as "3 (d4), 5 (d6), 12 (d20)"
        total: finalTotal,
        name: characterName || 'Unnamed Character',
        skill: 'Custom Roll',
        footer: modifier !== 0 ? `Dice: ${diceTotal}, Modifier: ${modifier >= 0 ? '+' : ''}${modifier}` : '',
        image: image || '', // Character image
      })
    } catch (error) {
      console.error('Error sending custom roll to Discord:', error)
      throw new Error('Failed to send custom roll. Check your connection or server.')
    }
  }
}

export default CustomRollService
