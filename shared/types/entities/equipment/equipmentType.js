import { createBaseEntity } from '../gameEntity.js'

/**
 * @typedef {Object} EquipmentType
 * @property {string|null} id - UUID identifier
 * @property {string} name - Type name (e.g., "Weapon", "Armor", "Item")
 * @property {string} description - Detailed description
 * @property {boolean} isDeleted - Soft delete flag
 * @property {string} createdAt - ISO 8601 datetime string
 * @property {string} lastModified - ISO 8601 datetime string
 */

/**
 * Creates a new default EquipmentType
 * @returns {EquipmentType}
 */
export function createDefaultEquipmentType() {
  return {
    ...createBaseEntity(),
    name: 'New Type',
    description: '',
  }
}
