import { createBaseEntity } from './baseEntity.js'

/**
 * @typedef {import('./baseEntity.js').BaseEntity} BaseEntity
 */

/**
 * @typedef {Object} AbilitySchoolFields
 * @property {string} name - School name (e.g., "Transmutation", "Way of the Hive")
 * @property {string} description - School description
 * @property {UUID|null} sourceId - Mestiere concept UUID this school belongs to
 * @property {string} color - Badge background color (CSS color string, e.g. '#7c3aed')
 * @property {number} index - Sort order index
 */

/**
 * @typedef {BaseEntity & AbilitySchoolFields} AbilitySchool
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
