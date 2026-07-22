import { createBaseEntity } from './baseEntity.js'

/**
 * @typedef {import('./baseEntity.js').BaseEntity} BaseEntity
 */

/**
 * @typedef {Object} BeastTypeFields
 * @property {string} name - Beast type name
 * @property {string} description - Beast type description
 * @property {string} artUrl - Art image URL
 * @property {number} index - Sort order index
 */

/**
 * @typedef {BaseEntity & BeastTypeFields} BeastType
 */

/**
 * Creates a new default BeastType
 * @returns {BeastType}
 */
export function createDefaultBeastType() {
  return {
    ...createBaseEntity(),
    name: 'New Beast Type',
    description: '',
    artUrl: '',
    index: 0,
  }
}
