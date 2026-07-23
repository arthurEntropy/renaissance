import { RollTypes } from '@/constants/rollTypes'
import { EngagementResultTypes } from '@/constants/engagementResultTypes'
import { DIE_TYPE, SPECIAL_ROLLS } from '@shared/constants/dice.js'

export function createEmptyRollStats() {
  return {
    skillChecks: {
      attempts: 0,
      successes: 0,
      totalSum: 0,
      bestTotal: null,
      hardestSuccess: null,
      bySkill: {},
      solCount: 0,
      morteCount: 0,
      successCount: 0,
    },
    contests: {
      engagement: { wins: 0, losses: 0, draws: 0 },
      contest: { wins: 0, losses: 0, draws: 0 },
    },
    xpEarned: 0,
    xpSpent: 0,
    treasureEarned: 0,
    treasureSpent: 0,
  }
}

export function normalizeRollStats(rollStats) {
  const defaults = createEmptyRollStats()
  const incoming = rollStats || {}

  return {
    skillChecks: {
      ...defaults.skillChecks,
      ...(incoming.skillChecks || {}),
      bySkill: {
        ...defaults.skillChecks.bySkill,
        ...((incoming.skillChecks && incoming.skillChecks.bySkill) || {}),
      },
    },
    contests: {
      engagement: {
        ...defaults.contests.engagement,
        ...((incoming.contests && incoming.contests.engagement) || {}),
      },
      contest: {
        ...defaults.contests.contest,
        ...((incoming.contests && incoming.contests.contest) || {}),
      },
    },
    xpEarned: incoming.xpEarned ?? 0,
    xpSpent: incoming.xpSpent ?? 0,
    treasureEarned: incoming.treasureEarned ?? 0,
    treasureSpent: incoming.treasureSpent ?? 0,
  }
}

function getDisplayDieRollValue(dieResult) {
  if (dieResult?.dieRollValue === 0 && dieResult?.originalDieRollValue) {
    return dieResult.originalDieRollValue
  }
  return dieResult?.dieRollValue
}

function countSkillCheckSpecialOutcomes(diceResults, skillChecks) {
  if (!Array.isArray(diceResults)) {
    return
  }

  diceResults.forEach((dieResult) => {
    const dieValue = getDisplayDieRollValue(dieResult)

    if (dieResult?.die?.dieSize === DIE_TYPE.D12) {
      if (dieValue === SPECIAL_ROLLS.SOL) {
        skillChecks.solCount += 1
      }
      if (dieValue === SPECIAL_ROLLS.MORTE) {
        skillChecks.morteCount += 1
      }
    }

    if (dieResult?.die?.dieSize === DIE_TYPE.D6 && dieValue === SPECIAL_ROLLS.SUCCESS) {
      skillChecks.successCount += 1
    }
  })
}

function updateSkillCheckStats(rollResult, stats) {
  const skillChecks = stats.skillChecks

  skillChecks.attempts += 1

  if (rollResult.success) {
    skillChecks.successes += 1
  }

  if (typeof rollResult.total === 'number') {
    skillChecks.totalSum += rollResult.total
    skillChecks.bestTotal = skillChecks.bestTotal === null
      ? rollResult.total
      : Math.max(skillChecks.bestTotal, rollResult.total)
  }

  if (rollResult.success && typeof rollResult.difficulty === 'number') {
    skillChecks.hardestSuccess = skillChecks.hardestSuccess === null
      ? rollResult.difficulty
      : Math.max(skillChecks.hardestSuccess, rollResult.difficulty)
  }

  const skillName = rollResult.baseSkillName || rollResult.skillName
  if (skillName) {
    skillChecks.bySkill[skillName] = (skillChecks.bySkill[skillName] || 0) + 1
  }

  countSkillCheckSpecialOutcomes(rollResult.diceResults, skillChecks)
}

function updateEngagementStats(rollResult, stats) {
  if (rollResult.result === EngagementResultTypes.WIN) {
    stats.contests.engagement.wins += 1
  } else if (rollResult.result === EngagementResultTypes.LOSS) {
    stats.contests.engagement.losses += 1
  } else if (rollResult.result === EngagementResultTypes.DRAW) {
    stats.contests.engagement.draws += 1
  }
}

export function applyRollToCharacterStats(character, rollResult) {
  if (!character || !rollResult?.type) {
    return
  }

  const stats = normalizeRollStats(character.rollStats)

  if (rollResult.type === RollTypes.SKILL_CHECK) {
    updateSkillCheckStats(rollResult, stats)
  } else if (rollResult.type === RollTypes.ENGAGEMENT) {
    updateEngagementStats(rollResult, stats)
  }

  character.rollStats = stats
}

export function computeXpEarned(roll) {
  if (roll.type !== RollTypes.SKILL_CHECK) return 0

  let xp = 0
  if (!roll.success) xp += 1
  if (roll.diceResults?.some(d => d.die?.dieSize === DIE_TYPE.D12 && d.dieRollValue === SPECIAL_ROLLS.MORTE)) xp += 1

  return xp
}
