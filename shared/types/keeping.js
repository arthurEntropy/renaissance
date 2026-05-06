import { createBaseEntity } from './gameEntity.js'

/**
 * @typedef {Object} Keeping
 * @property {string|null} id - UUID identifier
 * @property {string} name - Keeping level name
 * @property {string} description - Detailed description
 * @property {number} cost - Cost value
 * @property {boolean} isDeleted - Soft delete flag
 * @property {string} createdAt - ISO 8601 datetime string
 * @property {string} lastModified - ISO 8601 datetime string
 */

/**
 * Creates a new default Keeping level
 * @returns {Keeping}
 */
export function createDefaultKeeping() {
  return {
    ...createBaseEntity(),
    name: 'New Keeping Level',
    description: '',
    cost: 0,
  }
}
