import { createBaseEntity } from './baseEntity.js'

/**
 * @typedef {import('./baseEntity.js').BaseEntity} BaseEntity
 */

/**
 * @typedef {Object} ExpansionFields
 * @property {string} name - Expansion name
 * @property {string} logoUrl - Logo image URL
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
  }
}
