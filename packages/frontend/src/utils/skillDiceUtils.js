import { DIE_TYPE } from '@shared/constants/dice.js'
import { MAX_SKILL_RANKS } from '@shared/constants/characterConstants'

/** @typedef {import('@/types/rollPreviewTypes.js').SkillPreviewDie} SkillPreviewDie */

/**
 * Resolve the effective favored status accounting for explicit flags and
 * excess-negative diceMod (ranks + diceMod < 0).
 *
 * Excess-negative steps work against favored/flat/ill-favored in order:
 *   - Explicit favored,   excessSteps=0 → favored
 *   - Explicit favored,   excessSteps=1 → flat   (excess cancels favored)
 *   - Explicit favored,   excessSteps≥2 → ill-favored
 *   - Explicit ill-favored              → always ill-favored
 *   - Both flags (cancel), excessSteps=0 → flat
 *   - Both flags (cancel), excessSteps≥1 → ill-favored
 *   - Neither,             excessSteps≥1 → ill-favored
 *
 * @returns {{ isFavored: boolean, isIllFavored: boolean }}
 */
export const resolveEffectiveFavoredStatus = (skillConfig) => {
  const rawD6Count = (skillConfig.ranks || 0) + (skillConfig.diceMod || 0)
  const excessSteps = Math.max(0, -rawD6Count)

  const bothSet = skillConfig.isFavored && skillConfig.isIllFavored

  if (bothSet) {
    // Both flags cancel each other; excess then pushes toward ill-favored
    return { isFavored: false, isIllFavored: excessSteps >= 1 }
  }

  if (skillConfig.isFavored) {
    if (excessSteps === 0) return { isFavored: true, isIllFavored: false }
    if (excessSteps === 1) return { isFavored: false, isIllFavored: false } // excess cancels favored to flat
    return { isFavored: false, isIllFavored: true }                         // excessSteps >= 2
  }

  if (skillConfig.isIllFavored) {
    return { isFavored: false, isIllFavored: true }
  }

  // No explicit flag
  return { isFavored: false, isIllFavored: excessSteps >= 1 }
}

/**
 * Build a fixed-length array of MAX_SKILL_RANKS d6 preview dice, each with
 * one of: inactive, active, isAdded, isSubtracted.
 * Also returns the single d12 die.
 * @returns {{ d12Die: SkillPreviewDie, d6Dice: SkillPreviewDie[] }}
 */
export const buildDiceSetForSkill = (skillConfig, options = {}) => {
  if (!skillConfig) return { d12Die: null, d6Dice: [] }

  const baseRanks = Math.min(skillConfig.ranks || 0, MAX_SKILL_RANKS)
  const diceMod = skillConfig.diceMod || 0
  const { isFavored, isIllFavored } = resolveEffectiveFavoredStatus(skillConfig)

  // d12 — single die, colored by favored status
  const d12Die = /** @type {SkillPreviewDie} */ ({
    dieSize: DIE_TYPE.D12,
    isFavored,
    isIllFavored,
  })

  // Always exactly MAX_SKILL_RANKS d6 slots
  const d6Dice = /** @type {SkillPreviewDie[]} */ ([])
  for (let i = 0; i < MAX_SKILL_RANKS; i++) {
    const withinRanks = i < baseRanks
    // Positive mod adds dice beyond ranks (capped at MAX_SKILL_RANKS)
    const withinDiceMod = diceMod > 0 && i >= baseRanks && i < Math.min(baseRanks + diceMod, MAX_SKILL_RANKS)
    // Negative mod crosses out the last |diceMod| rank dice
    const isSubtracted = diceMod < 0 && withinRanks && i >= baseRanks + diceMod

    d6Dice.push({
      dieSize: DIE_TYPE.D6,
      isActive: withinRanks || withinDiceMod,
      isAdded: withinDiceMod,
      isSubtracted,
    })
  }

  if (options.includeDiceClass && options.getDiceFontMaxClass) {
    d12Die.cssClass = options.getDiceFontMaxClass(DIE_TYPE.D12)
    d6Dice.forEach(die => { die.cssClass = options.getDiceFontMaxClass(DIE_TYPE.D6) })
  }

  return { d12Die, d6Dice }
}
