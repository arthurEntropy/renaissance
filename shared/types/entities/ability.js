import { createBaseEntity } from './gameEntity.js'

/**
 * @typedef {import('./Improvement.js').Improvement} Improvement
 */

/**
 * @typedef {Object} Ability
 * @property {UUID|null} id - UUID identifier
 * @property {string} name - Ability name
 * @property {string|null} [artUrl] - Optional art image URL
 * @property {HTMLString} description - Detailed description
 * @property {HTMLString|null} [successes] - Optional success outcomes HTML (✨/🌞/💀 style)
 * @property {UUID|null} type - Ability type ID reference (trait, action, half action, etc.)
 * @property {boolean} canBeActive - Whether this ability can be toggled active/inactive
 * @property {boolean} isActive - Current active state
 * @property {UUID|null} source - Source concept ID (ancestry, culture, mestiere, world element)
 * @property {boolean} isDeleted - Soft delete flag
 * @property {number|null} mp - Mestiere point cost
 * @property {number|null} xp - Experience point cost
 * @property {string|null} manaCost - Mana cost string for Channeler spells (e.g., '2WUB')
 * @property {boolean} isMagical - Whether this ability is magical in nature
 * @property {UUID|null} school - Ability school UUID reference (e.g., Transmutation, Way of the Hive)
 * @property {Improvement[]} [improvements] - Optional purchasable improvements
 * @property {string[]} [biomeTagsAugment] - Biome tags that augment this ability
 * @property {string[]} [biomeTagsInhibit] - Biome tags that inhibit this ability
 * @property {ISODateString} createdAt - ISO 8601 datetime string
 * @property {ISODateString} lastModified - ISO 8601 datetime string
 */

/**
 * Creates a new default Ability
 * @returns {Ability}
 */
export function createDefaultAbility() {
  return {
    ...createBaseEntity(),
    name: 'New Ability',
    description: '',
    type: null,
    canBeActive: false,
    isActive: true,
    source: null,
    mp: null,
    xp: null,
    manaCost: null, // Only for Channeler spells
    isMagical: false,
    school: null,
  }
}
