import { createBaseEntity } from './baseEntity.js'

/**
 * @typedef {import('./baseEntity.js').BaseEntity} BaseEntity
 */

/**
 * @typedef {Object} EquipmentRangeFields
 * @property {string} name - Range name (e.g., "Melee", "Reach", "Ranged")
 * @property {string} description - Distance description (e.g., "Within Reach, 25 feet")
 * @property {number} index - Sort order index
 */

/**
 * @typedef {BaseEntity & EquipmentRangeFields} EquipmentRange
 */

/**
 * Creates a new default EquipmentRange
 * @returns {EquipmentRange}
 */
export function createDefaultEquipmentRange() {
  return {
    ...createBaseEntity(),
    name: 'New Range',
    description: '',
    index: 0,
  }
}
