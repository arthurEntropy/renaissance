import { createBaseEntity } from '../gameEntity.js'

/**
 * @typedef {Object} EquipmentSubtype
 * @property {string|null} id - UUID identifier
 * @property {string} name - Subtype name (e.g., "Sword", "Axe", "Bow")
 * @property {string|null} typeId - Parent equipment type UUID reference
 * @property {string} description - Detailed description
 * @property {number} index - Sort order index
 * @property {boolean} isDeleted - Soft delete flag
 * @property {string} createdAt - ISO 8601 datetime string
 * @property {string} lastModified - ISO 8601 datetime string
 */

/**
 * Creates a new default EquipmentSubtype
 * @returns {EquipmentSubtype}
 */
export function createDefaultEquipmentSubtype() {
  return {
    ...createBaseEntity(),
    name: 'New Subtype',
    typeId: null,
    description: '',
    index: 0,
  }
}
