import { createBaseEntity } from './baseEntity.js'

/**
 * @typedef {import('./baseEntity.js').BaseEntity} BaseEntity
 */

/**
 * @typedef {Object} ExpansionFields
 * @property {string} name - Expansion name
 * @property {string} logoUrl - Logo image URL
 * @property {boolean} isAdminVisible - Whether concepts in this expansion are visible to admin users (trumps isPublic for admins)
 * @property {boolean} isPublic - Whether concepts in this expansion are visible to all users
 */

/**
 * @typedef {BaseEntity & ExpansionFields} Expansion
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
    isAdminVisible: true,
    isPublic: false,
  }
}
