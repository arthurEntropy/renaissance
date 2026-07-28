import { RollTypes } from '@/constants/rollTypes'
import { DIE_TYPE } from '@shared/constants/dice.js'
import eventBus, { ROLL_EVENTS } from '../events/eventBus'
import BaseRollService from './baseRollService.js'

class InitiativeRollService extends BaseRollService {

  static makeInitiativeRoll(character) {
    // Initiative is 1d12 + WITS
    const dicePool = [{ dieSize: DIE_TYPE.D12 }]
    
    // Roll the dice
    let diceResults = this.rollDicePool(dicePool)
    
    // Calculate dice total
    const diceTotal = this.calculateTotal(diceResults)
    
    // Apply WITS modifier
    const modifier = character.wits || 0
    const finalTotal = diceTotal + modifier
    
    // Format dice for display
    const formattedDiceResults = this.formatDiceForDisplay(diceResults, RollTypes.INITIATIVE)
    
    // Create roll result
    const rollResult = this.createRollResult(RollTypes.INITIATIVE, {
      characterName: character.name,
      skillName: 'Initiative',
      baseSkillName: 'Initiative',
      total: finalTotal,
      diceTotal: diceTotal,
      modifier: modifier,
      modifierLabel: 'WITS',
      difficulty: null,
      success: null,
      diceResults: formattedDiceResults,
      favoredStatus: null,
      footer: null,
      _rerollData: {
        character
      }
    })
    
    // Emit event for external integrations
    eventBus.emit(ROLL_EVENTS.INITIATIVE_ROLL, { rollResult, character })
    
    return rollResult
  }
}

export default InitiativeRollService
