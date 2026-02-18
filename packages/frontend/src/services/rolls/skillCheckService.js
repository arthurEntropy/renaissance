import { RollTypes } from '@/constants/rollTypes'
import { CONDITIONS, STATES } from '@shared/constants/characterConstants.js'
import { SKILL_STATUS } from '@/constants/skillStatus.js'
import eventBus, { ROLL_EVENTS } from '../events/eventBus'
import BaseRollService from './baseRollService.js'

class SkillCheckService extends BaseRollService {

  static makeSkillCheck(skill, character, targetNumber, options = {}) {
    // Perform the skill check roll (handles auto-fail check internally)
    const { diceResults, total, isAutoFail } = this.performSkillCheckRoll(skill, character)
    
    // Determine success (auto-fail means not successful)
    const isSuccess = !isAutoFail && total >= targetNumber
    
    // Build result
    const rollResult = this._buildSkillCheckResult(skill, character, targetNumber, diceResults, total, isSuccess)
    
    // Emit event for external integrations (Discord, analytics, etc.)
    eventBus.emit(ROLL_EVENTS.SKILL_CHECK, {
      rollResult,
      character,
      integrations: {
        discord: options.sendToDiscord !== false
      }
    })
    
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
    Object.keys(conditions).forEach((conditionKey) => {
      if (conditions[conditionKey]) {
        const condition = Object.values(CONDITIONS).find(c => c.key === conditionKey)
        if (condition) {
          footerText.push(condition.label)
        }
      }
    })

    // Add states to footer text
    Object.keys(states).forEach((stateKey) => {
      if (states[stateKey]) {
        const state = Object.values(STATES).find(s => s.key === stateKey)
        if (state) {
          footerText.push(state.label)
        }
      }
    })

    // Concatenate conditions and states as a comma-separated string
    return footerText.join(', ') || ''
  }
}

export default SkillCheckService
