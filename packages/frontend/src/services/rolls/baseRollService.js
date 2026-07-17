import DiceRoller from './utils/DiceRoller.js'
import DiceProcessor from './utils/DiceProcessor.js'
import DiceFormatter from './utils/DiceFormatter.js'
import { DIE_TYPE } from '@shared/constants/dice.js'
import { SKILL_STATUS } from '@/constants/skillStatus.js'
import { MAX_SKILL_RANKS } from '@shared/constants/characterConstants.js'

class BaseRollService {

  static getFavoredStatus(skill) {
    if (skill.isFavored && !skill.isIllFavored) return SKILL_STATUS.FAVORED
    if (skill.isIllFavored && !skill.isFavored) return SKILL_STATUS.ILL_FAVORED
    return null
  }

  static rollDicePool(dicePool) {
    return DiceRoller.rollPool(dicePool)
  }

  static processFavoredAndIllFavored(diceResults, skill) {
    // If only favored or only ill-favored, apply the respective processing
    if (skill.isFavored && !skill.isIllFavored) {
      return DiceProcessor.applyFavoredOrIllFavored(diceResults, true)
    } else if (skill.isIllFavored && !skill.isFavored) {
      return DiceProcessor.applyFavoredOrIllFavored(diceResults, false)
    }
    // If both or neither, no processing required
    return diceResults
  }

  static calculateTotal(diceResults, twiceWeary = false) {
    return DiceProcessor.calculateTotal(diceResults, twiceWeary)
  }

  static createMaxValueDiceResult(diceArray, rollType) {
    return DiceFormatter.createMaxValueDiceResult(diceArray, rollType)
  }

  static formatDiceForDisplay(diceResults, rollType) {
    // Mark dice that rolled max value (for styling)
    DiceProcessor.markMaxValueDice(diceResults)
    
    // Add CSS classes and emojis (mutates)
    DiceFormatter.addDisplayData(diceResults, rollType)
    
    // Sort based on roll type
    return DiceFormatter.sortByRollType(diceResults, rollType)
  }

  static prepareDicePool(skill) {
    const dicePool = []

    const rawD6Count = (skill.ranks || 0) + (skill.diceMod || 0)
    const excessSteps = Math.max(0, -rawD6Count)

    // Resolve favored status using the same step-by-step logic as resolveEffectiveFavoredStatus
    let isFavored, isIllFavored
    const bothSet = skill.isFavored && skill.isIllFavored
    if (bothSet) {
      isFavored = false
      isIllFavored = excessSteps >= 1
    } else if (skill.isFavored) {
      isFavored = excessSteps === 0
      isIllFavored = excessSteps >= 2
    } else if (skill.isIllFavored) {
      isFavored = false
      isIllFavored = true
    } else {
      isFavored = false
      isIllFavored = excessSteps >= 1
    }

    // Add d12(s) — favored or ill-favored rolls 2 d12s (keep higher / lower)
    const d12Count = (isFavored || isIllFavored) ? 2 : 1
    for (let i = 0; i < d12Count; i++) {
      dicePool.push({ dieSize: DIE_TYPE.D12 })
    }

    // Add d6s — capped at MAX_SKILL_RANKS (5), minimum 0
    const totalD6Count = Math.min(MAX_SKILL_RANKS, Math.max(0, rawD6Count))
    for (let i = 0; i < totalD6Count; i++) {
      dicePool.push({ dieSize: DIE_TYPE.D6 })
    }

    return dicePool
  }

  // Shared logic for skill checks and contests
  static performSkillCheckRoll(skill, character) {
    const dicePool = this.prepareDicePool(skill)
    let diceResults = this.rollDicePool(dicePool)
    
    // If a character is Twice Miserable, rolling Morte on their d12 auto-fails the skill check
    const isAutoFail = character.states.twiceMiserable && 
                      DiceProcessor.checkAutoFail(diceResults, true, skill.isFavored)
    
    // If auto-fail, don't process favored/ill-favored or calculate total
    if (isAutoFail) {
      return { diceResults, total: 0, isAutoFail: true }
    }
    
    // Normal processing
    diceResults = this.processFavoredAndIllFavored(diceResults, skill)
    const total = this.calculateTotal(diceResults, character.states.twiceWeary)
    
    return { diceResults, total, isAutoFail: false }
  }

  static createRollResult(type, data) {
    return {
      type,
      timestamp: Date.now(),
      ...data
    }
  }
}

export default BaseRollService
