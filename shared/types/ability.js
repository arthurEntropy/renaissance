import { createBaseEntity } from './baseEntity.js'

/**
 * @typedef {import('./baseEntity.js').BaseEntity} BaseEntity
 * @typedef {import('./improvement.js').Improvement} Improvement
 * @typedef {import('./actionCost.js').ActionCost} ActionCost
 * @typedef {import('../constants/biomeTags.js').BiomeTagValue} BiomeTagValue
 */

/**
 * @typedef {Object} AbilityFields
 * @property {string} name - Ability name
 * @property {string|null} artUrl - Art image URL
 * @property {HTMLString} description - Ability description
 * @property {HTMLString|null} [successes] - Success outcomes (✨/🌞/💀)
 * @property {Improvement[]} [improvements] - Ability improvements, purchaseable with XP
 * @property {UUID|null} source - Source concept UUID (ancestry, culture, mestiere, world element)
 * @property {UUID|null} school - Ability school UUID reference (only for mestiere-sourced abilities)
 * @property {boolean} isMagical - Whether this ability is magical (referred to as a "spell" in the rules/UI)
 * @property {boolean} canBeActive - Whether this ability can be toggled active (to track duration/ongoing effects)
 * 
 * Costs
 * @property {UUID|null} actionCost - Action cost type UUID reference (e.g., Action, Reaction, Free Action)
 * @property {number|null} mpCost - Mestiere point cost
 * @property {number|null} xpCost - Experience point cost
 * @property {string|null} manaCost - Mana cost string for Channeler spells (e.g., '2WUB')
 * 
 * Biome interactions
 * @property {BiomeTagValue[]} [biomeTagsAugment] - Biome tags that augment this ability
 * @property {BiomeTagValue[]} [biomeTagsInhibit] - Biome tags that inhibit this ability
 */

/**
 * @typedef {BaseEntity & AbilityFields} Ability
 */

/**
 * Creates a new default Ability
 * @returns {Ability}
 */
export function createDefaultAbility() {
  return {
    ...createBaseEntity(),

    // Ability-specific fields
    name: 'New Ability',
    artUrl: null,
    description: '',
    successes: null,
    improvements: [],
    source: null,
    school: null,
    isMagical: false,

    // Costs
    actionCost: null,
    mpCost: null,
    xpCost: null,
    manaCost: null,

    // Biome interactions
    biomeTagsAugment: [],
    biomeTagsInhibit: [],

    // Activation
    canBeActive: false,
  }
}
