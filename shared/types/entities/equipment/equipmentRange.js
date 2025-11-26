import { createBaseEntity } from '../gameEntity.js'

/**
 * @typedef {Object} EquipmentRange
 * @property {string|null} id - UUID identifier
 * @property {string} name - Range name (e.g., "Melee", "Reach", "Ranged")
 * @property {string} distance - Distance description (e.g., "25 feet")
 * @property {number} index - Sort order index
 * @property {boolean} isDeleted - Soft delete flag
 * @property {string} createdAt - ISO 8601 datetime string
 * @property {string} lastModified - ISO 8601 datetime string
 */

/**
 * Creates a new default EquipmentRange
 * @returns {EquipmentRange}
 */
export function createDefaultEquipmentRange() {
  return {
    ...createBaseEntity(),
    name: 'New Range',
    distance: '',
    index: 0,
  }
}
