import axios from 'axios'
import { getDiceFontClass } from '../../utils/diceFontUtils'
import { RollTypes } from '../constants/rollTypes'

class SkillCheckService {
  static latestRollResult = null

  static getLatestRollResult() {
    return this.latestRollResult
  }

  static makeSkillCheck(skill, character, targetNumber) {
    // Prepare the dice pool based on the skill and roll the dice.
    const dice = this.prepareDicePool(skill)
    const results = this.rollDice(dice)

    // Check for twice miserable condition and handle auto-fail if applicable.
    if (
      character.states.twiceMiserable &&
      this.checkAndHandleAutoFailForTwiceMiserable(
        results,
        skill.isFavored,
        skill.name,
        character,
        targetNumber,
      )
    ) {
      return
    }

    // Handle favored and ill-favored logic and append favored/ill-favored status to skill name for output.
    const skillModifier = this.handleFavoredAndIllFavored(results, skill)
    const skillName = skill.name + skillModifier

    // Calculate the total sum of the rolled dice and determine success.
    const totalSum = this.calculateTotalSum(
      results,
      character.states.twiceWeary,
    )
    const success = this.determineSuccess(totalSum, targetNumber)

    // Generate the footer text based on character conditions and states.
    const footer = this.generateFooter(character.conditions, character.states)

    // Mark max value dice (12 for d12, 6 for d6)
    results.forEach((r) => {
      r.isMaxValue =
        (r.die === 12 && r.roll === 12) || (r.die === 6 && r.roll === 6)
      r.dropped = r.roll === 0 // Any dice with roll=0 were dropped by favored/ill-favored logic
    })

    // Create roll result object to be used in-app and sent to Discord.
    const rollResult = {
      type: RollTypes.SKILL_CHECK,
      characterName: character.name,
      skillName: skillName,
      baseSkillName: skill.name,
      total: totalSum,
      targetNumber: targetNumber,
      success: success,
      diceSymbols: results.map((r) => r.symbol),
      diceResults: results.map((r) => ({
        type: r.die, // 12 or 6
        value: r.roll, // The actual number rolled (0 for dropped dice)
        symbol: r.symbol, // Symbol for Discord ouput
        isMaxValue:
          (r.die === 12 && r.roll === 12) || (r.die === 6 && r.roll === 6),
        emoji: this.getDiceEmoji(r.die, r.roll === 0 ? r.originalRoll : r.roll),
        dropped: r.roll === 0, // Was this die dropped by favored/ill-favored logic
        displayValue: r.roll === 0 ? r.originalRoll : r.roll,
        class: getDiceFontClass(r.die, r.roll === 0 ? r.originalRoll : r.roll), // For in-app display using DiceFont
      })),
      favoredStatus: skill.isFavored
        ? 'favored'
        : skill.isIllFavored
          ? 'ill-favored'
          : null,
      footer: footer,
      timestamp: Date.now(),
    }

    // Store latest roll
    this.latestRollResult = rollResult

    // Send to Discord
    // TODO: Make this optional
    this.sendSkillCheckResultsToServer(
      results.map((r) => r.symbol),
      totalSum,
      success,
      skillName,
      footer,
      character.artUrls[0],
      targetNumber,
      character.name,
    )

    return rollResult
  }

  static prepareDicePool(skill) {
    const dice = [{ sides: 12 }]

    if (skill.isFavored || skill.isIllFavored) {
      dice.push({ sides: 12 })
    }

    let totalD6 = skill.ranks + skill.diceMod
    if (totalD6 < 0) totalD6 = 0

    for (let i = 0; i < totalD6; i++) {
      dice.push({ sides: 6 })
    }

    return dice
  }

  static rollDice(dice) {
    return dice.map((die) => {
      const roll = Math.floor(Math.random() * die.sides) + 1
      let symbol
      if (die.sides === 12) {
        if (roll === 12) {
          symbol = '⭓12🌞'
        } else if (roll === 11) {
          symbol = '⭓11💀'
        } else {
          symbol = `⭓${roll}`
        }
      } else if (die.sides === 6 && roll === 6) {
        symbol = `◽️6✨`
      } else {
        symbol = `◽️${roll}`
      }

      return { die: die.sides, roll: roll, symbol: symbol }
    })
  }

  static checkAndHandleAutoFailForTwiceMiserable(
    results,
    isFavored,
    skillName,
    character,
    targetNumber,
  ) {
    const d12Rolls = results.filter((r) => r.die === 12).map((r) => r.roll)
    const autoFail = isFavored
      ? d12Rolls.filter((roll) => roll === 11).length === 2
      : d12Rolls.includes(11)

    if (autoFail) {
      this.sendSkillCheckResultsToServer(
        results.map((r) => r.symbol),
        0,
        false,
        skillName,
        this.generateFooter(character.conditions, character.states),
        character.artUrl,
        targetNumber,
        character.name,
      )
    }

    return autoFail
  }

  static handleFavoredAndIllFavored(results, skill) {
    if (!(skill.isFavored && skill.isIllFavored)) {
      if (skill.isFavored) {
        this.handleFavored(results)
        return ' (favored)' // Return string to append to skill name
      }
      if (skill.isIllFavored) {
        this.handleIllFavored(results)
        return ' (ill-favored)' // Return string to append to skill name
      }
    }
    return '' // No favored/ill-favored status to append
  }

  static handleFavored(results) {
    const d12Results = results.filter((r) => r.die === 12)
    const d12Rolls = d12Results.map((r) => r.roll)

    const highestD12Roll = d12Rolls.reduce((max, roll) => {
      if (roll === 11) return max
      return max === 11 || roll > max ? roll : max
    }, 11)

    let keptOne = false
    d12Results.forEach((r) => {
      if (r.roll === highestD12Roll && !keptOne) {
        keptOne = true
      } else {
        r.originalRoll = r.roll // Preserve the original roll
        r.roll = 0 // Mark as not contributing to total
      }
    })
  }

  static handleIllFavored(results) {
    // Filter to get only d12 results
    const d12Results = results.filter((r) => r.die === 12)
    const d12Rolls = d12Results.map((r) => r.roll)

    // Find the lowest roll, but if 11 is present, treat it as the lowest
    const lowestD12Roll = d12Rolls.includes(11) ? 11 : Math.min(...d12Rolls)

    // Find the first occurrence of the lowest roll and set it to 0
    let keptOne = false
    d12Results.forEach((r) => {
      if (r.roll === lowestD12Roll && !keptOne) {
        keptOne = true
      } else {
        r.originalRoll = r.roll // Preserve the original roll
        r.roll = 0 // Mark as not contributing to total
      }
    })
  }

  static calculateTotalSum(results, isTwiceWeary) {
    return results.reduce((sum, r) => {
      // If it's a d12 with value 11, treat it as 0
      if (r.die === 12 && r.roll === 11) {
        return sum
      }

      // If dice were dropped due to favored/ill-favored (roll = 0), don't add
      if (r.roll === 0) {
        return sum
      }

      // Apply Twice Weary rule (d6 rolls of 1-3 don't count toward total)
      if (r.die === 6 && r.roll <= 3 && isTwiceWeary) {
        return sum
      }

      // Otherwise, add the roll to the total
      return sum + r.roll
    }, 0)
  }

  static determineSuccess(totalSum, targetNumber) {
    return totalSum >= targetNumber
  }

  static generateFooter(conditions, states) {
    const footerText = []

    // Add conditions to footer text
    Object.keys(conditions).forEach((condition) => {
      if (conditions[condition]) {
        footerText.push(condition.charAt(0).toUpperCase() + condition.slice(1))
      }
    })

    // Add states to footer text
    const formattedStateNames = {
      twiceWeary: 'Twice Weary',
      twiceMiserable: 'Twice Miserable',
      twiceHelpless: 'Twice Helpless',
    }
    Object.keys(states).forEach((state) => {
      if (states[state]) {
        footerText.push(
          formattedStateNames[state] ||
            state.charAt(0).toUpperCase() + state.slice(1),
        )
      }
    })

    // Concatenate conditions and states as a comma-separated string
    return footerText.join(', ') || ''
  }

  static getDiceEmoji(dieType, value) {
    if (dieType === 12) {
      if (value === 12) return '🌞' // For 'Sol'
      if (value === 11) return '💀' // For 'Morte'
    } else if (dieType === 6 && value === 6) {
      return '✨' // For successes on success dice
    }
    return null
  }

  static async sendSkillCheckResultsToServer(
    rollResults,
    totalSum,
    success,
    skillName,
    footer,
    image,
    targetNumber,
    characterName,
  ) {
    try {
      await axios.post(`${process.env.VUE_APP_API_URL || 'http://localhost:3000'}/send-discord-message`, {
        rollResults,
        total: totalSum,
        targetNumber,
        name: characterName || 'Unnamed Character',
        skill: skillName,
        success,
        footer,
        image,
      })
    } catch (error) {
      console.error('Error sending skill check:', error)
      alert('Failed to send skill check. Check your connection or server.')
    }
  }
}

export default SkillCheckService
