import { createBaseEntity } from './baseEntity.js'

/**
 * @typedef {import('./baseEntity.js').BaseEntity} BaseEntity
 */

/**
 * @typedef {Object} KeepingFields
 * @property {string} name - Keeping name
 * @property {string} description - Keeping description
 * @property {number} cost - Cost, in treasure
 * @property {string} imageUrl - Background image URL for keeping badge displays
 */

/**
 * @typedef {BaseEntity & KeepingFields} Keeping
 */

/**
 * Creates a new default Keeping
 * @returns {Keeping}
 */
export function createDefaultKeeping() {
  return {
    ...createBaseEntity(),
    name: 'New Keeping',
    description: '',
    cost: 0,
    imageUrl: '',
  }
}
