import { RollTypes } from '@/constants/rollTypes'
import eventBus, { ROLL_EVENTS } from '../events/eventBus'
import BaseRollService from './baseRollService.js'

class DamageRollService extends BaseRollService {

  static makeDamageRoll(dicePool, modifier, character, options = {}) {
    const sanitizedDicePool = Array.isArray(dicePool)
      ? dicePool.filter((die) => Number.isInteger(die?.dieSides) && die.dieSides > 0)
      : []

    if (!character || sanitizedDicePool.length === 0) {
      return null
    }

    const rollName = options.rollName || 'Damage Roll'
    const baseSkillName = options.baseSkillName || rollName
    const sourceName = options.sourceName || null
    const modifierLabel = options.modifierLabel || 'Modifier'

    let diceResults = this.rollDicePool(sanitizedDicePool)
    const diceTotal = this.calculateTotal(diceResults)
    const finalTotal = diceTotal + modifier

    const formattedDiceResults = this.formatDiceForDisplay(diceResults, RollTypes.DAMAGE)

    const footer = options.footer || `${modifier >= 0 ? '+' : ''}${modifierLabel}`

    const rollResult = this.createRollResult(RollTypes.DAMAGE, {
      characterName: character.name,
      skillName: rollName,
      baseSkillName,
      total: finalTotal,
      diceTotal,
      modifier,
      difficulty: null,
      success: null,
      diceResults: formattedDiceResults,
      favoredStatus: null,
      footer,
      sourceName,
      modifierLabel,
      _rerollData: {
        dicePool: sanitizedDicePool,
        modifier,
        character,
        rollName,
        baseSkillName,
        sourceName,
        modifierLabel
      }
    })

    eventBus.emit(ROLL_EVENTS.DAMAGE_ROLL, {
      rollResult,
      character,
      integrations: {
        discord: options.sendToDiscord !== false
      }
    })

    return rollResult
  }

  static makeEquipmentDamageRoll(equipment, character, options = {}) {
    const damageDice = Array.isArray(equipment?.damageDice) ? equipment.damageDice : []
    const dicePool = damageDice
      .filter((dieSides) => Number.isInteger(dieSides) && dieSides > 0)
      .map((dieSides) => ({ dieSides }))

    const bodyModifier = character?.body || 0

    return this.makeDamageRoll(dicePool, bodyModifier, character, {
      rollName: 'Damage',
      baseSkillName: 'Damage',
      sourceName: equipment?.name || null,
      modifierLabel: 'BODY',
      footer: '+ BODY',
      ...options
    })
  }
}

export default DamageRollService
