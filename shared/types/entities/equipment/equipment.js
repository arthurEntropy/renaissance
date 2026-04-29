import { createBaseEntity } from '../gameEntity.js'

/**
 * @typedef {import('../../dice.js').DieSides} DieSides
 */

/**
 * @typedef {Object} DamageDie
 * @property {DieSides} sides - Number of sides on the die (4, 6, 8, 10, 12, or 20)
 * @property {number} count - Number of dice to roll
 */

/**
 * @typedef {Object} EngagementDie
 * @property {DieSides} sides - Number of sides on the die (4, 6, 8, 10, 12, or 20)
 * @property {number} count - Number of dice to roll
 */

/**
 * @typedef {Object} SkillMod
 * @property {string} skillName - Name of the skill
 * @property {number} modifier - Modifier value
 */

/**
 * @typedef {Object} EquipmentImprovement
 * @property {string} id - Improvement UUID
 * @property {string} name - Improvement name
 * @property {string} description - Improvement description (HTML)
 * @property {number} xp - Experience point cost
 */

/**
 * @typedef {Object} Equipment
 * @property {string|null} id - UUID identifier
 * @property {string} name - Equipment name
 * @property {string} description - Detailed description
 * @property {string|null} keeping - Keeping level UUID reference
 * @property {string|null} source - Source concept UUID (ancestry, culture, etc.)
 * @property {string|null} [school] - Ability school UUID reference (only for mestiere-sourced equipment)
 * @property {number} weight - Weight value
 * @property {number} length - Length value
 * @property {number} reach - Reach value
 * @property {string|null} range - Range UUID reference
 * @property {boolean} twoHanded - Whether item requires two hands
 * @property {boolean} thrown - Whether item can be thrown
 * @property {boolean} finesse - Whether item has finesse property
 * @property {boolean} piercing - Whether item has piercing property
 * @property {DamageDie[]} damageDice - Damage dice configuration
 * @property {EngagementDie[]} engagementDice - Engagement dice configuration
 * @property {string[]} engagementSuccesses - Engagement success UUIDs (ChipTag style)
 * @property {SkillMod[]} skillMods - Skill modifiers granted by this equipment
 * @property {EquipmentImprovement[]} [improvements] - Equipment improvements with XP costs
 * @property {string|null} [successes] - Success outcomes HTML (✨/🌞/💀 style, like abilities)
 * @property {boolean} isDeleted - Soft delete flag
 * @property {boolean} isCustom - Whether this is custom/user-created equipment
 * @property {boolean} isTemplate - Whether this is a template for creating new equipment
 * @property {boolean} isMagical - Whether this equipment is magical in nature
 * @property {string|null} artUrl - Art image URL
 * @property {string|null} type - Equipment type UUID reference
 * @property {string|null} subtype - Equipment subtype UUID reference
 * @property {string|null} grade - Equipment grade UUID reference
 * @property {number} defenseBonus - Defense bonus granted when wearing this item (armor only)
 * @property {string} createdAt - ISO 8601 datetime string
 * @property {string} lastModified - ISO 8601 datetime string
 */

/**
 * Creates a new default Equipment item
 * @returns {Equipment}
 */
export function createDefaultEquipment() {
  return {
    ...createBaseEntity(),
    name: 'New Item',
    description: '',
    keeping: null,
    source: null,
    school: null,
    weight: 0,
    length: 0,
    reach: 0,
    range: null,
    twoHanded: false,
    thrown: false,
    finesse: false,
    piercing: false,
    damageDice: [],
    engagementDice: [],
    engagementSuccesses: [],
    skillMods: [],
    improvements: [],
    successes: null,
    isMagical: false,
    isCustom: false,
    isTemplate: false,
    artUrl: null,
    type: null,
    subtype: null,
    grade: null,
    defenseBonus: 0,
  }
}
