import DiceRoller from './utils/DiceRoller.js'
import DiceProcessor from './utils/DiceProcessor.js'
import DiceFormatter from './utils/DiceFormatter.js'
import { DIE_TYPE } from '@shared/constants/dice.js'
import { SKILL_STATUS } from '@/constants/skillStatus.js'

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
    
    // Add d12(s)
    const d12Count = (skill.isFavored || skill.isIllFavored) ? 2 : 1 // Favored or ill-favored gets 2 d12s
    for (let i = 0; i < d12Count; i++) {
      dicePool.push({ dieSides: DIE_TYPE.D12 })
    }
    
    // Add d6s based on ranks + diceMod
    let totalD6Count = skill.ranks + (skill.diceMod || 0)
    if (totalD6Count < 0) totalD6Count = 0
    
    for (let i = 0; i < totalD6Count; i++) {
      dicePool.push({ dieSides: DIE_TYPE.D6 })
    }
    
    return dicePool
  }

  // Shared logic for skill checks and opposed skill checks
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
