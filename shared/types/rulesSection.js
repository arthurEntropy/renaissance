import { createBaseEntity } from './baseEntity.js'

/**
 * @typedef {Object} RulesSection
 * @property {string|null} id - UUID identifier
 * @property {string} name - Section name
 * @property {string} content - Section content (rich text/markdown)
 * @property {string} imageUrl - Associated image URL
 * @property {number} index - Display order index
 * @property {boolean} isDeleted - Soft delete flag
 * @property {string} createdAt - ISO 8601 datetime string
 * @property {string} lastModified - ISO 8601 datetime string
 */

/**
 * Creates a new default RulesSection
 * @returns {RulesSection}
 */
export function createDefaultRulesSection() {
  return {
    ...createBaseEntity(),
    name: 'New Section',
    content: '',
    imageUrl: '',
    index: 0,
  }
}
