import { createBaseEntity } from './baseEntity.js'

/**
 * @typedef {import('./baseEntity.js').BaseEntity} BaseEntity
 */

/**
 * @typedef {Object} KeepingFields
 * @property {string} name - Keeping name
 * @property {string} description - Keeping description
 * @property {number} cost - Cost, in treasure
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
  }
}
