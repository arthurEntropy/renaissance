import { createBaseEntity } from './baseEntity.js'

/**
 * @typedef {import('./baseEntity.js').BaseEntity} BaseEntity
 */

/**
 * @typedef {Object} ActionCostFields
 * @property {string} name - Action cost name (e.g., "Action", "Reaction", "Free Action")
 * @property {number} index - Sort order index
 */

/**
 * @typedef {BaseEntity & ActionCostFields} ActionCost
 */

/**
 * Creates a new default ActionCost
 * @returns {ActionCost}
 */
export function createDefaultActionCost() {
  return {
    ...createBaseEntity(),
    name: 'New Action Cost',
    index: 0,
  }
}
