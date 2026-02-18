import { RollTypes } from '@/constants/rollTypes'
import { DIE_TYPE, SPECIAL_ROLLS } from '@shared/constants/dice.js'
import eventBus, { ROLL_EVENTS } from '../events/eventBus'
import BaseRollService from './baseRollService.js'

class InjuryRollService extends BaseRollService {

  static makeInjuryRoll(character) {
    const dicePool = [{ dieSides: DIE_TYPE.D12 }]
    let diceResults = this.rollDicePool(dicePool)

    const featDieResult = diceResults[0]?.dieRollValue || 0
    const currentInjury = character.injury || 0
    const maxDefense = character.defense?.max || 0

    let injuryApplied = 0
    let resultingInjury = currentInjury
    let footer = ''

    if (featDieResult === SPECIAL_ROLLS.SOL) {
      footer = 'No injury!'
    } else if (featDieResult === SPECIAL_ROLLS.MORTE) {
      resultingInjury = Math.max(currentInjury, maxDefense)
      injuryApplied = resultingInjury - currentInjury
      footer = 'Injury increases to your max Defense.'
    } else {
      injuryApplied = featDieResult
      resultingInjury = currentInjury + injuryApplied
      footer = `+${injuryApplied} Injury.`
    }

    const formattedDiceResults = this.formatDiceForDisplay(diceResults, RollTypes.INJURY)

    const rollResult = this.createRollResult(RollTypes.INJURY, {
      characterName: character.name,
      skillName: 'Injury',
      baseSkillName: 'Injury',
      total: injuryApplied,
      diceTotal: featDieResult,
      modifier: 0,
      difficulty: null,
      success: null,
      diceResults: formattedDiceResults,
      favoredStatus: null,
      footer,
      currentInjury,
      resultingInjury,
      _rerollData: {
        character
      }
    })

    eventBus.emit(ROLL_EVENTS.INJURY_ROLL, { rollResult, character })

    return rollResult
  }
}

export default InjuryRollService
