import { createBaseEntity } from '../gameEntity.js'

/**
 * @typedef {Object} EquipmentGrade
 * @property {string|null} id - UUID identifier
 * @property {string} name - Grade name (e.g., "Common", "Martial", "Great")
 * @property {string} description - Detailed description
 * @property {number} index - Sort order index
 * @property {boolean} isDeleted - Soft delete flag
 * @property {string} createdAt - ISO 8601 datetime string
 * @property {string} lastModified - ISO 8601 datetime string
 */

/**
 * Creates a new default EquipmentGrade
 * @returns {EquipmentGrade}
 */
export function createDefaultEquipmentGrade() {
  return {
    ...createBaseEntity(),
    name: 'New Grade',
    description: '',
    index: 0,
  }
}
