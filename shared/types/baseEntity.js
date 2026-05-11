/**
 * Base structure for all game entities
 * Contains fields that are common to every entity type in the system
 *
 * @typedef {Object} BaseEntity
 * @property {string|null} id - UUID identifier
 * @property {boolean} isDeleted - Soft delete flag
 * @property {string} createdAt - ISO 8601 datetime string
 * @property {string} lastModified - ISO 8601 datetime string
 */

/**
 * Creates base fields for a new entity
 * @returns {BaseEntity}
 */
export function createBaseEntity() {
  const now = new Date().toISOString()
  return {
    id: null,
    isDeleted: false,
    createdAt: now,
    lastModified: now,
  }
}
