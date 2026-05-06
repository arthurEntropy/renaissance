import { createBaseEntity } from './baseEntity.js'

/**
 * @typedef {Object} AbilitySchool
 * @property {string|null} id - UUID identifier
 * @property {string} name - School name (e.g., "Transmutation", "Way of the Hive")
 * @property {string} description - Detailed description
 * @property {string|null} sourceId - Mestiere concept UUID this school belongs to
 * @property {string} color - Badge background color (CSS color string, e.g. '#7c3aed')
 * @property {number} index - Sort order index
 * @property {boolean} isDeleted - Soft delete flag
 * @property {string} createdAt - ISO 8601 datetime string
 * @property {string} lastModified - ISO 8601 datetime string
 */

/**
 * Creates a new default AbilitySchool
 * @returns {AbilitySchool}
 */
export function createDefaultAbilitySchool() {
  return {
    ...createBaseEntity(),
    name: 'New School',
    description: '',
    sourceId: null,
    color: '',
    index: 0,
  }
}
