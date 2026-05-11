import { createBaseEntity } from './baseEntity.js'

/**
 * @typedef {import('./baseEntity.js').BaseEntity} BaseEntity
 */

/**
 * @typedef {Object} RulesSectionFields
 * @property {string} name - Section name
 * @property {HTMLString} content - Section content
 * @property {string} imageUrl - Associated image URL
 * @property {number} index - Display order index
 */

/**
 * @typedef {BaseEntity & RulesSectionFields} RulesSection
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
