import { createBaseEntity } from './gameEntity.js'

/**
 * @typedef {Object} Ability
 * @property {string|null} id - UUID identifier
 * @property {string} name - Ability name
 * @property {string} description - Detailed description
 * @property {boolean} isTrait - Whether this is a trait
 * @property {boolean} canBeActive - Whether this ability can be toggled active/inactive
 * @property {boolean} isActive - Current active state
 * @property {string|null} source - Source concept ID (ancestry, culture, mestiere, world element)
 * @property {boolean} isDeleted - Soft delete flag
 * @property {number|null} mp - Mestiere point cost
 * @property {number|null} xp - Experience point cost
 * @property {string|null} manaCost - Mana cost string for Channeler spells (e.g., '2WUB')
 * @property {string} createdAt - ISO 8601 datetime string
 * @property {string} lastModified - ISO 8601 datetime string
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
    isTrait: false,
    canBeActive: false,
    isActive: true,
    source: null,
    mp: null,
    xp: null,
    manaCost: null, // Only for Channeler spells
  }
}
