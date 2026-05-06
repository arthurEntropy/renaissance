import { createBaseEntity } from './gameEntity.js'

/**
 * @typedef {import('./gameEntity.js').GameEntity} GameEntity
 */

/**
 * @typedef {Object} ActionCostFields
 * @property {string} name - Action cost name (e.g., "Action", "Reaction", "Free Action")
 * @property {number} index - Sort order index
 */

/**
 * @typedef {GameEntity & ActionCostFields} ActionCost
 */

/**
 * Creates a new default ActionCost
 * @returns {ActionCost}
 */
export function createDefaultActionCost() {
  const baseEntity = createBaseEntity()

  return {
    // Base entity fields
    id: baseEntity.id,
    isDeleted: baseEntity.isDeleted,
    createdAt: baseEntity.createdAt,
    lastModified: baseEntity.lastModified,

    // Action cost fields
    name: 'New Action Cost',
    index: 0,
  }
}
