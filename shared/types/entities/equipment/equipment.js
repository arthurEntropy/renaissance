import { createBaseEntity } from '../gameEntity.js'

/**
 * @typedef {import('../../dice.js').DieSize} DieSize
 * @typedef {import('../improvement.js').Improvement} Improvement
 * @typedef {import('../gameEntity.js').GameEntity} GameEntity
 */

/**
 * @typedef {Object} EquipmentFields
 * @property {string} name - Equipment name
 * @property {string|null} artUrl - Art image URL
 * @property {HTMLString} description - Equipment description
 * @property {HTMLString|null} [successes] - Success outcomes (✨/🌞/💀)
 * @property {Improvement[]} [improvements] - Equipment improvements with XP costs
 * @property {UUID|null} source - Source concept UUID (ancestry, culture, etc.)
 * @property {UUID|null} school - Ability school UUID reference (only for mestiere-sourced equipment)
 * @property {UUID|null} keeping - Keeping level UUID reference
 * @property {boolean} isCustom - Whether this is custom/user-created equipment
 * @property {boolean} isTemplate - Whether this is a template for creating new equipment
 * @property {boolean} isMagical - Whether this equipment is magical
 *
 * Categories
 * @property {UUID|null} type - Equipment type UUID reference
 * @property {UUID|null} subtype - Equipment subtype UUID reference
 * @property {UUID|null} grade - Equipment grade UUID reference
 *
 * Properties
 * @property {number} weight - Weight value, in pounds
 * @property {number} length - Length value, in feet
 * @property {number} reach - Reach value, in increments of 5 feet
 * @property {UUID|null} range - Range UUID reference
 * @property {boolean} twoHanded - Whether item requires two hands
 * @property {boolean} thrown - Whether item can be thrown
 * @property {boolean} finesse - Whether item has the finesse property
 * @property {boolean} piercing - Whether item has the piercing property
 *
 * Combat
 * @property {DieSize[]} damageDice - Damage dice values by die size
 * @property {DieSize[]} engagementDice - Engagement dice values by die size
 * @property {UUID[]} engagementSuccesses - Engagement success UUIDs
 * @property {number} defenseBonus - Defense bonus granted when wearing/wielding this item
 */

/**
 * @typedef {GameEntity & EquipmentFields} Equipment
 */

/**
 * Creates a new default Equipment item
 * @returns {Equipment}
 */
export function createDefaultEquipment() {
  const baseEntity = createBaseEntity()

  return {
    // Base entity fields
    id: baseEntity.id,
    isDeleted: baseEntity.isDeleted,
    createdAt: baseEntity.createdAt,
    lastModified: baseEntity.lastModified,

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
    
    // Categories
    type: null,
    subtype: null,
    grade: null,

    // Properties
    weight: 0,
    length: 0,
    reach: 0,
    range: null,
    twoHanded: false,
    thrown: false,
    finesse: false,
    piercing: false,

    // Combat
    damageDice: [],
    engagementDice: [],
    engagementSuccesses: [],
    defenseBonus: 0,
  }
}
