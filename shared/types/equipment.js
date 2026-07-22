import { createBaseEntity } from './baseEntity.js'

/**
 * @typedef {import('./dice.js').DieSize} DieSize
 * @typedef {import('./improvement.js').Improvement} Improvement
 * @typedef {import('./baseEntity.js').BaseEntity} BaseEntity
 */

/**
 * @typedef {Object} EquipmentFields
 * @property {string} name - Equipment name
 * @property {string|null} artUrl - Art image URL
 * @property {HTMLString} description - Equipment description
 * @property {HTMLString|null} [successes] - Success outcomes (✨/🌞/💀)
 * @property {Improvement[]} [improvements] - Equipment improvements, purchaseable with XP
 * @property {UUID|null} source - Source concept UUID (ancestry, culture, mestiere, world element)
 * @property {UUID|null} school - Ability school UUID reference (only for mestiere-sourced equipment)
 * @property {UUID|null} keeping - Keeping level UUID reference
 * @property {boolean} isCustom - Whether this is custom/user-created equipment
 * @property {boolean} isTemplate - Whether this is a template for creating new equipment
 * @property {boolean} isMagical - Whether this equipment is magical
 * @property {boolean} isBeastEquipment - Whether this equipment is beast-specific (used to populate beast character sheets)
 * @property {boolean} hasDifficulty - Whether this equipment sets a Difficulty that should be tracked per-character
 *
 * Categories
 * @property {UUID|null} type - Equipment type UUID reference
 * @property {UUID|null} subtype - Equipment subtype UUID reference
 * @property {UUID|null} grade - Equipment grade UUID reference
 *
 * Properties
 * @property {number} weight - Weight value, in pounds
 * @property {number} reach - Reach value, in increments of 5 feet
 * @property {UUID|null} range - Range UUID reference
 * @property {boolean} twoHanded - Whether item requires two hands
 * @property {boolean} thrown - Whether item can be thrown
 * @property {boolean} finesse - Whether item has the finesse property
 * @property {boolean} piercing - Whether item has the piercing property
 * @property {boolean} projectile - Whether item fires projectiles (bows, crossbows)
 *
 * Combat
 * @property {DieSize[]} damageDice - Damage dice values by die size
 * @property {DieSize[]} engagementDice - Engagement dice values by die size
 * @property {UUID[]} engagementSuccesses - Engagement success UUIDs
 * @property {number} defenseBonus - Defense bonus granted when wearing/wielding this item
 */

/**
 * @typedef {BaseEntity & EquipmentFields} Equipment
 */

/**
 * Creates a new default Equipment item
 * @returns {Equipment}
 */
export function createDefaultEquipment() {
  return {
    ...createBaseEntity(),

    // Equipment-specific fields
    name: 'New Equipment Item',
    artUrl: null,
    description: '',
    successes: null,
    improvements: [],
    source: null,
    school: null,
    keeping: null,
    isCustom: false,
    isTemplate: false,
    isMagical: false,
    isBeastEquipment: false,
    hasDifficulty: false,
    
    // Categories
    type: null,
    subtype: null,
    grade: null,

    // Properties
    weight: 0,
    reach: 0,
    range: null,
    twoHanded: false,
    thrown: false,
    finesse: false,
    piercing: false,
    projectile: false,

    // Combat
    damageDice: [],
    engagementDice: [],
    engagementSuccesses: [],
    defenseBonus: 0,
  }
}
