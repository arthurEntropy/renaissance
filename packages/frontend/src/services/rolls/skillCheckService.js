import { RollTypes } from '@/constants/rollTypes'
import { CHARACTER_STATE_LABELS } from '@/constants/characterStates.js'
import { CHARACTER_CONDITION_LABELS } from '@/constants/characterConditions.js'
import { SKILL_STATUS } from '@/constants/skillStatus.js'
import DiscordAdapter from './utils/DiscordAdapter.js'
import BaseRollService from './baseRollService.js'

class SkillCheckService extends BaseRollService {

  static makeSkillCheck(skill, character, targetNumber) {
    // Perform the skill check roll (handles auto-fail check internally)
    const { diceResults, total, isAutoFail } = this.performSkillCheckRoll(skill, character)
    
    // Determine success (auto-fail means not successful)
    const isSuccess = !isAutoFail && total >= targetNumber
    
    // Build result and send to Discord
    const rollResult = this._buildSkillCheckResult(skill, character, targetNumber, diceResults, total, isSuccess)
    DiscordAdapter.sendSkillCheck(rollResult, character)
    return rollResult
  }

  static _buildSkillCheckResult(skill, character, targetNumber, diceResults, total, success) {
    const skillName = this._formatSkillNameWithFavoredStatus(skill)
    const footer = this._generateFooter(character.conditions, character.states)
    const formattedDiceResults = this.formatDiceForDisplay(diceResults, RollTypes.SKILL_CHECK)
    
    return this.createRollResult(RollTypes.SKILL_CHECK, {
      characterName: character.name,
      skillName: skillName,
      baseSkillName: skill.name,
      total: total,
      targetNumber: targetNumber,
      success: success,
      diceResults: formattedDiceResults,
      favoredStatus: this.getFavoredStatus(skill),
      footer: footer,
      _rerollData: {
        skill: { ...skill },
        character: { ...character },
        targetNumber: targetNumber
      }
    })
  }

  static _formatSkillNameWithFavoredStatus(skill) {
    if (skill.isFavored && !skill.isIllFavored) {
      return `${skill.name} (${SKILL_STATUS.FAVORED})`
    } else if (skill.isIllFavored && !skill.isFavored) {
      return `${skill.name} (${SKILL_STATUS.ILL_FAVORED})`
    }
    return skill.name
  }

  // Favored and ill-favored cancel each other out; return status accordingly
  static _generateFooter(conditions, states) {
    const footerText = []

    // Add conditions to footer text
    Object.keys(conditions).forEach((condition) => {
      if (conditions[condition]) {
        footerText.push(CHARACTER_CONDITION_LABELS[condition])
      }
    })

    // Add states to footer text
    Object.keys(states).forEach((state) => {
      if (states[state]) {
        footerText.push(CHARACTER_STATE_LABELS[state])
      }
    })

    // Concatenate conditions and states as a comma-separated string
    return footerText.join(', ') || ''
  }
}

export default SkillCheckService
