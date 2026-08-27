import { RollTypes } from '@/constants/rollTypes'
import { CORE_ABILITIES } from '@shared/constants/characterConstants'
import eventBus, { ROLL_EVENTS } from '../events/eventBus'
import BaseRollService from './baseRollService.js'

class DamageRollService extends BaseRollService {

  static makeDamageRoll(dicePool, modifier, character, options = {}) {
    const sanitizedDicePool = Array.isArray(dicePool)
      ? dicePool.filter((die) => Number.isInteger(die?.dieSize) && die.dieSize > 0)
      : []

    if (!character || sanitizedDicePool.length === 0) {
      return null
    }

    const rollName = options.rollName || 'Damage Roll'
    const baseSkillName = options.baseSkillName || rollName
    const sourceName = options.sourceName || null
    const modifierLabel = options.modifierLabel || 'Modifier'
    const illFavored = !!options.illFavored

    // When ill-favored, add one extra die of the most common size in the pool and
    // then drop the single lowest-valued die from the result set.
    let poolToRoll = sanitizedDicePool
    if (illFavored && sanitizedDicePool.length > 0) {
      // Pick the most common die size; tie-break by smallest size.
      const sizeFreq = sanitizedDicePool.reduce((acc, { dieSize }) => {
        acc[dieSize] = (acc[dieSize] || 0) + 1
        return acc
      }, {})
      const extraSize = Object.entries(sizeFreq)
        .sort(([a, fa], [b, fb]) => fb - fa || Number(a) - Number(b))[0][0]
      poolToRoll = [...sanitizedDicePool, { dieSize: Number(extraSize) }]
    }

    let diceResults = this.rollDicePool(poolToRoll)

    // Apply ill-favored penalty: mark the die with the lowest value as dropped.
    if (illFavored && diceResults.length > 0) {
      let lowestIndex = 0
      let lowestValue = diceResults[0].dieRollValue
      diceResults.forEach((result, i) => {
        if (result.dieRollValue < lowestValue) {
          lowestValue = result.dieRollValue
          lowestIndex = i
        }
      })
      const dropped = diceResults[lowestIndex]
      if (!dropped.originalDieRollValue) dropped.originalDieRollValue = dropped.dieRollValue
      dropped.dieRollValue = 0
      dropped.isDropped = true
    }

    // Damage rolls are not feat-die rolls, so fate die rules (Morte = 0) do not apply
    const diceTotal = this.calculateTotal(diceResults, false, false)
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
      favoredStatus: illFavored ? 'ill-favored' : null,
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
        modifierLabel,
        illFavored,
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
      .filter((dieSize) => Number.isInteger(dieSize) && dieSize > 0)
      .map((dieSize) => ({ dieSize }))

    const bodyModifier = character?.body || 0

    return this.makeDamageRoll(dicePool, bodyModifier, character, {
      rollName: 'Damage',
      baseSkillName: 'Damage',
      sourceName: equipment?.name || null,
      modifierLabel: CORE_ABILITIES.BODY.label,
      footer: `+ ${CORE_ABILITIES.BODY.label}`,
      ...options
    })
  }
}

export default DamageRollService
