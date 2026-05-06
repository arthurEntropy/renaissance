import { createBaseEntity } from '../gameEntity.js'

/**
 * @typedef {import('../gameEntity.js').GameEntity} GameEntity
 */

/**
 * @typedef {Object} EquipmentRangeFields
 * @property {string} name - Range name (e.g., "Melee", "Reach", "Ranged")
 * @property {string} description - Distance description (e.g., "Within Reach, 25 feet")
 * @property {number} index - Sort order index
 */

/**
 * @typedef {GameEntity & EquipmentRangeFields} EquipmentRange
 */

/**
 * Creates a new default EquipmentRange
 * @returns {EquipmentRange}
 */
export function createDefaultEquipmentRange() {
  const baseEntity = createBaseEntity()

  return {
    // Base entity fields
    id: baseEntity.id,
    isDeleted: baseEntity.isDeleted,
    createdAt: baseEntity.createdAt,
    lastModified: baseEntity.lastModified,

    // Equipment range fields
    name: 'New Range',
    description: '',
    index: 0,
  }
}
