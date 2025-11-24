import { getDiceFontClass } from '@/utils/diceFontUtils'
import { getDiceEmoji } from '@/utils/diceUtils'
import { RollTypes } from '@/constants/rollTypes'
import { DIE_TYPE, SPECIAL_ROLLS, TWICE_WEARY_THRESHOLD } from '../../../../../shared/constants/dice.js'
import BaseRollService from './baseRollService.js'

class SkillCheckService extends BaseRollService {

  static makeOpposedSkillCheck(skill, character) {
    // Prepare the dice pool based on the skill and roll the dice.
    const dicePool = this.prepareDicePool(skill)
    const diceResults = this.rollDice(dicePool)

    // Handle favored and ill-favored logic
    this.handleFavoredAndIllFavored(diceResults, skill)

    // Calculate the total sum of the rolled dice
    const totalSum = this.calculateTotalSum(
      diceResults,
      character.states.twiceWeary,
    )

    // Mark max value dice and dropped dice
    this.markSpecialDice(diceResults)

    // Add index to each die result for backend compatibility
    diceResults.forEach((result, index) => {
      result.poolIndex = index
      // Ensure originalDieRollValue is set for dropped dice
      if (result.dieRollValue === 0 && !result.originalDieRollValue) {
        result.originalDieRollValue = result.dieRollValue
      }
    })

    // Return the roll data (no Discord sending or success determination for opposed checks)
    return {
      diceResults: diceResults,
      totalSum: totalSum,
      skillConfig: skill,
      characterInfo: character
    }
  }

  static makeSkillCheck(skill, character, targetNumber) {
    // Prepare the dice pool based on the skill and roll the dice.
    const dicePool = this.prepareDicePool(skill)
    const diceResults = this.rollDice(dicePool)

    // Check for twice miserable condition and handle auto-fail if applicable.
    if (
      character.states.twiceMiserable &&
      this.checkAndHandleAutoFailForTwiceMiserable(
        diceResults,
        skill.isFavored,
        skill.name,
        character,
        targetNumber,
      )
    ) {
      return
    }

    // Handle favored and ill-favored logic and append favored/ill-favored status to skill name for output.
    const skillModifier = this.handleFavoredAndIllFavored(diceResults, skill)
    const skillName = skill.name + skillModifier

    // Calculate the total sum of the rolled dice and determine success.
    const totalSum = this.calculateTotalSum(
      diceResults,
      character.states.twiceWeary,
    )
    const isSuccess = this.determineSuccess(totalSum, targetNumber)

    // Generate the footer text based on character conditions and states.
    const footer = this.generateFooter(character.conditions, character.states)

    // Mark max value dice and dropped dice
    this.markSpecialDice(diceResults)

    // Create roll result object to be used in-app and sent to Discord.
    const rollResult = this.createRollResult(
      skill,
      character,
      skillName,
      totalSum,
      targetNumber,
      isSuccess,
      diceResults,
      footer,
    )

    // Store latest roll
    this.latestRollResult = rollResult

    // Send to Discord
    this.sendSkillCheckResultsToServer(
      diceResults,
      totalSum,
      isSuccess,
      skillName,
      footer,
      character.artUrls[0],
      targetNumber,
      character.name,
    )

    return rollResult
  }

  static markSpecialDice(diceResults) {
    diceResults.forEach((result) => {
      result.rolledMaxValue = result.dieSides === result.dieRollValue
      result.isDropped = result.dieRollValue === 0 // Any dice with dieRollValue=0 were dropped by favored/ill-favored logic
    })
  }

  static createRollResult(skill, character, skillName, totalSum, targetNumber, isSuccess, diceResults, footer) {
    return {
      type: RollTypes.SKILL_CHECK,
      characterName: character.name,
      skillName: skillName,
      baseSkillName: skill.name,
      total: totalSum,
      targetNumber: targetNumber,
      success: isSuccess,
      diceResults: diceResults.map((result) => ({
        dieSides: result.dieSides,
        dieRollValue: result.dieRollValue,
        rolledMaxValue: result.dieSides === result.dieRollValue,
        emoji: getDiceEmoji(result.dieSides, result.dieRollValue === 0 ? result.originalDieRollValue : result.dieRollValue),
        isDropped: result.dieRollValue === 0,
        displayDieRollValue: result.dieRollValue === 0 ? result.originalDieRollValue : result.dieRollValue,
        cssClass: getDiceFontClass(result.dieSides, result.dieRollValue === 0 ? result.originalDieRollValue : result.dieRollValue),
      })),
      favoredStatus: skill.isFavored
        ? 'favored'
        : skill.isIllFavored
          ? 'ill-favored'
          : null,
      footer: footer,
      timestamp: Date.now(),
    }
  }

  static prepareDicePool(skill) {
    const dicePool = [{ dieSides: DIE_TYPE.D12 }]

    if (skill.isFavored || skill.isIllFavored) {
      dicePool.push({ dieSides: DIE_TYPE.D12 })
    }

    let totalD6Count = skill.ranks + skill.diceMod
    if (totalD6Count < 0) totalD6Count = 0

    for (let i = 0; i < totalD6Count; i++) {
      dicePool.push({ dieSides: DIE_TYPE.D6 })
    }

    return dicePool
  }

  static rollDice(dicePool) {
    return dicePool.map((die) => {
      const roll = Math.floor(Math.random() * die.dieSides) + 1
      return { dieSides: die.dieSides, dieRollValue: roll }
    })
  }

  static checkAndHandleAutoFailForTwiceMiserable(
    diceResults,
    isFavored,
    skillName,
    character,
    targetNumber,
  ) {
    const d12Rolls = diceResults.filter((result) => result.dieSides === DIE_TYPE.D12).map((result) => result.dieRollValue)
    const autoFail = isFavored
      ? d12Rolls.filter((roll) => roll === SPECIAL_ROLLS.MORTE).length === 2
      : d12Rolls.includes(SPECIAL_ROLLS.MORTE)

    if (autoFail) {
      this.sendSkillCheckResultsToServer(
        diceResults,
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

  static handleFavoredAndIllFavored(diceResults, skill) {
    if (!(skill.isFavored && skill.isIllFavored)) {
      if (skill.isFavored) {
        this.handleFavored(diceResults)
        return ' (favored)' // Return string to append to skill name
      }
      if (skill.isIllFavored) {
        this.handleIllFavored(diceResults)
        return ' (ill-favored)' // Return string to append to skill name
      }
    }
    return '' // No favored/ill-favored status to append
  }

  static handleFavored(diceResults) {
    const d12Results = diceResults.filter((result) => result.dieSides === DIE_TYPE.D12)
    const d12Rolls = d12Results.map((result) => result.dieRollValue)

    const highestD12Roll = d12Rolls.reduce((max, roll) => {
      if (roll === SPECIAL_ROLLS.MORTE) return max
      return max === SPECIAL_ROLLS.MORTE || roll > max ? roll : max
    }, SPECIAL_ROLLS.MORTE)

    let keptOne = false
    d12Results.forEach((result) => {
      if (result.dieRollValue === highestD12Roll && !keptOne) {
        keptOne = true
      } else {
        result.originalDieRollValue = result.dieRollValue // Preserve the original roll
        result.dieRollValue = 0 // Mark as not contributing to total
      }
    })
  }

  static handleIllFavored(diceResults) {
    // Filter to get only d12 results
    const d12Results = diceResults.filter((result) => result.dieSides === DIE_TYPE.D12)
    const d12Rolls = d12Results.map((result) => result.dieRollValue)

    // Find the lowest roll, but if Morte (11) is present, treat it as the lowest
    const lowestD12Roll = d12Rolls.includes(SPECIAL_ROLLS.MORTE) ? SPECIAL_ROLLS.MORTE : Math.min(...d12Rolls)

    // Find the first occurrence of the lowest roll and set it to 0
    let keptOne = false
    d12Results.forEach((result) => {
      if (result.dieRollValue === lowestD12Roll && !keptOne) {
        keptOne = true
      } else {
        result.originalDieRollValue = result.dieRollValue // Preserve the original roll
        result.dieRollValue = 0 // Mark as not contributing to total
      }
    })
  }

  static calculateTotalSum(diceResults, isTwiceWeary) {
    return diceResults.reduce((sum, result) => {
      // If it's a d12 with Morte (11), treat it as 0
      if (result.dieSides === DIE_TYPE.D12 && result.dieRollValue === SPECIAL_ROLLS.MORTE) {
        return sum
      }

      // If dice were dropped due to favored/ill-favored (dieRollValue = 0), don't add
      if (result.dieRollValue === 0) {
        return sum
      }

      // Apply Twice Weary rule (d6 rolls of 1-3 don't count toward total)
      if (result.dieSides === DIE_TYPE.D6 && result.dieRollValue <= TWICE_WEARY_THRESHOLD && isTwiceWeary) {
        return sum
      }

      // Otherwise, add the roll to the total
      return sum + result.dieRollValue
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
      return this.sendToDiscord({
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
      console.warn('Could not send to Discord:', error.message)
    }
  }
}

export default SkillCheckService
