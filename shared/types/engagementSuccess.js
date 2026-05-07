import { createBaseEntity } from './baseEntity.js'

/**
 * @typedef {import('./baseEntity.js').BaseEntity} BaseEntity
 */

/**
 * @typedef {Object} EngagementSuccessFields
 * @property {string} name - Success name
 * @property {string} description - Success description
 */

/**
 * @typedef {BaseEntity & EngagementSuccessFields} EngagementSuccess
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
