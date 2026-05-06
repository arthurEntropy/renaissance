import { createBaseEntity } from './gameEntity.js'

/**
 * @typedef {Object} Expansion
 * @property {string|null} id - UUID identifier
 * @property {string} name - Expansion name
 * @property {string} logoUrl - Logo image URL
 * @property {boolean} isDeleted - Soft delete flag
 * @property {string} createdAt - ISO 8601 datetime string
 * @property {string} lastModified - ISO 8601 datetime string
 */

/**
 * Creates a new default Expansion
 * @returns {Expansion}
 */
export function createDefaultExpansion() {
  return {
    ...createBaseEntity(),
    name: 'New Expansion',
    logoUrl: '',
  }
}
