import { createBaseEntity } from './gameEntity.js'

/**
 * @typedef {Object} EngagementSuccess
 * @property {string|null} id - UUID identifier
 * @property {string} name - Success name
 * @property {string} description - Detailed description
 * @property {boolean} isDeleted - Soft delete flag
 * @property {string} createdAt - ISO 8601 datetime string
 * @property {string} lastModified - ISO 8601 datetime string
 */

/**
 * Creates a new default EngagementSuccess
 * @returns {EngagementSuccess}
 */
export function createDefaultEngagementSuccess() {
  return {
    ...createBaseEntity(),
    name: 'New Engagement Success',
    description: '',
  }
}
