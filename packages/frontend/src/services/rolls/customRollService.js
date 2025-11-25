import { RollTypes } from '@/constants/rollTypes'
import DiscordAdapter from './utils/DiscordAdapter.js'
import BaseRollService from './baseRollService.js'

class CustomRollService extends BaseRollService {

  static makeCustomRoll(dicePool, modifier, character) {
    // Roll the dice
    let diceResults = this.rollDicePool(dicePool)
    
    // Calculate dice total
    const diceTotal = this.calculateTotal(diceResults)
    
    // Apply modifier
    const finalTotal = diceTotal + modifier
    
    // Format dice for display
    const formattedDiceResults = this.formatDiceForDisplay(diceResults, RollTypes.CUSTOM_ROLL)
    
    // Create roll result
    const rollResult = this.createRollResult(RollTypes.CUSTOM_ROLL, {
      characterName: character.name,
      skillName: 'Custom Roll',
      baseSkillName: 'Custom Roll',
      total: finalTotal,
      diceTotal: diceTotal,
      modifier: modifier,
      targetNumber: null,
      success: null,
      diceResults: formattedDiceResults,
      favoredStatus: null,
      footer: '',
      _rerollData: {
        dicePool,
        modifier,
        character
      }
    })
    
    // Send to Discord
    DiscordAdapter.sendCustomRoll(rollResult, character)
    
    return rollResult
  }
}

export default CustomRollService
