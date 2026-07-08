import InitiativeRollService from './initiativeRollService'
import SkillCheckService from './skillCheckService'
import InjuryRollService from './injuryRollService'
import { SPECIAL_ROLLS, EMOJI } from '@shared/constants/dice.js'

// Coordinates batch rolls across multiple characters for GM multi-combatant workflows
class BatchRollOrchestrationService {
  /**
   * Execute a batch initiative roll per game rules:
   * - Each combatant rolls 1d12 + WITS → individual total
   * - Group total = highest + lowest individual totals (or the single result if only one combatant)
   * - Sol (d12=12) and Morte (d12=11) are flagged; Morte means caught off guard
   */
  static executeBatchInitiativeRoll(characters) {
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const rollsByCharacterId = {}
    const rawMembers = []

    characters.forEach((character) => {
      try {
        const rollResult = InitiativeRollService.makeInitiativeRoll(character)
        rollsByCharacterId[character.id] = rollResult

        const diceRoll = rollResult.diceTotal  // raw d12 value (before WITS modifier)
        const isSol = diceRoll === SPECIAL_ROLLS.SOL
        const isMorte = diceRoll === SPECIAL_ROLLS.MORTE

        rawMembers.push({
          characterId: character.id,
          name: character.name,
          individualTotal: rollResult.total,
          diceRoll,
          isSol,
          isMorte,
          isCaughtOffGuard: isMorte,
          emoji: isSol ? EMOJI.SOL : isMorte ? EMOJI.MORTE : null,
          role: null,
          success: true,
        })
      } catch (error) {
        console.error(`Initiative roll failed for character ${character.id}:`, error)
        rawMembers.push({
          characterId: character.id,
          name: character.name,
          individualTotal: null,
          diceRoll: null,
          isSol: false,
          isMorte: false,
          isCaughtOffGuard: false,
          emoji: null,
          role: null,
          success: false,
          error: error.message,
        })
      }
    })

    // Compute group initiative total per rules:
    // highest + lowest when ≥2 combatants; single result when exactly 1
    const successfulMembers = rawMembers.filter((m) => m.success && m.individualTotal !== null)
    successfulMembers.sort((a, b) => b.individualTotal - a.individualTotal)

    let groupTotal = null

    if (successfulMembers.length === 1) {
      groupTotal = successfulMembers[0].individualTotal
      successfulMembers[0].role = 'only'
    } else if (successfulMembers.length >= 2) {
      groupTotal = successfulMembers[0].individualTotal + successfulMembers[successfulMembers.length - 1].individualTotal
      successfulMembers[0].role = 'highest'
      successfulMembers[successfulMembers.length - 1].role = 'lowest'
      for (let i = 1; i < successfulMembers.length - 1; i++) {
        successfulMembers[i].role = 'middle'
      }
    }

    // Members array: successful results (sorted highest→lowest), then any failed rolls
    const members = [
      ...successfulMembers,
      ...rawMembers.filter((m) => !m.success || m.individualTotal === null),
    ]

    return {
      batchId,
      rollType: 'batch_initiative',
      rollsByCharacterId,
      members,
      groupTotal,
      timestamp: Date.now(),
    }
  }

  // Execute a batch skill check; returns per-character results and aggregate success/failure counts
  static executeBatchSkillCheck(characters, skill, difficulty) {
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const results = []
    const rollsByCharacterId = {}
    let successCount = 0
    let failureCount = 0

    characters.forEach((character) => {
      try {
        const rollResult = SkillCheckService.makeSkillCheck(skill, character, difficulty)
        rollsByCharacterId[character.id] = rollResult

        const success = rollResult.success === true
        if (success) successCount++
        else failureCount++

        results.push({
          characterId: character.id,
          character,
          rollResult,
          success,
          total: rollResult.total,
          difficulty,
          margin: rollResult.total - difficulty,
        })
      } catch (error) {
        console.error(`Skill check roll failed for character ${character.id}:`, error)
        results.push({
          characterId: character.id,
          character,
          rollResult: null,
          error: error.message,
          success: false,
        })
        failureCount++
      }
    })

    return {
      batchId,
      rollType: 'batch_skill_check',
      rollsByCharacterId,
      results,
      timestamp: Date.now(),
      aggregate: {
        totalParticipants: characters.length,
        successCount,
        failureCount,
        successRate: characters.length > 0 ? (successCount / characters.length) : 0,
      },
    }
  }

  // Execute a batch injury roll; returns per-character injury states and aggregate counts
  static executeBatchInjuryRoll(characters) {
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const results = []
    const rollsByCharacterId = {}
    const injurySummary = { uninjured: 0, wounded: 0, grievously: 0, dead: 0 }

    characters.forEach((character) => {
      try {
        const rollResult = InjuryRollService.makeInjuryRoll(character)
        rollsByCharacterId[character.id] = rollResult

        const injuryState = rollResult.injuryState || 'unknown'
        if (injurySummary[injuryState] !== undefined) {
          injurySummary[injuryState]++
        }

        results.push({
          characterId: character.id,
          character,
          rollResult,
          injuryState,
          success: true,
        })
      } catch (error) {
        console.error(`Injury roll failed for character ${character.id}:`, error)
        results.push({
          characterId: character.id,
          character,
          rollResult: null,
          error: error.message,
          success: false,
        })
      }
    })

    return {
      batchId,
      rollType: 'batch_injury',
      rollsByCharacterId,
      results,
      timestamp: Date.now(),
      aggregate: injurySummary,
    }
  }

  /**
   * Get the sorted results from a batch initiative roll
   * (Results already sorted in executeBatchInitiativeRoll)
   *
   * @param {Object} batchResult - Result from executeBatchInitiativeRoll
   * @returns {Array} Sorted results by initiative (descending)
   */
  static getSortedInitiativeOrder(batchResult) {
    if (batchResult.rollType !== 'batch_initiative') {
      console.warn('Invalid batch result type for initiative ordering')
      return []
    }
    return batchResult.results
  }

  /**
   * Get character groups by success/failure from a batch skill check
   *
   * @param {Object} batchResult - Result from executeBatchSkillCheck
   * @returns {Object} { succeeded: [results], failed: [results] }
   */
  static getSkillCheckGroups(batchResult) {
    if (batchResult.rollType !== 'batch_skill_check') {
      console.warn('Invalid batch result type for skill check grouping')
      return { succeeded: [], failed: [] }
    }
    return {
      succeeded: batchResult.results.filter((r) => r.success),
      failed: batchResult.results.filter((r) => !r.success),
    }
  }
}

export default BatchRollOrchestrationService
