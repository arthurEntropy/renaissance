import { createBaseEntity } from './baseEntity.js'

/**
 * @typedef {Object} ArtTags
 * @property {'faces'|'places'|'maps'} type - Type of art
 * @property {string[]} sources - Array of concept IDs this art is associated with
 */

/**
 * @typedef {Object} Art
 * @property {string|null} id - UUID identifier
 * @property {string} url - Image URL
 * @property {ArtTags} tags - Categorization tags
 * @property {boolean} isDeleted - Soft delete flag
 * @property {string} createdAt - ISO 8601 datetime string
 * @property {string} lastModified - ISO 8601 datetime string
 */

/**
 * Creates a new default Art entry
 * @returns {Art}
 */
export function createDefaultArt() {
  return {
    ...createBaseEntity(),
    url: '',
    tags: {
      type: 'faces',
      sources: []
    },
  }
}
