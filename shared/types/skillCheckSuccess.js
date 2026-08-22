import { createBaseEntity } from './baseEntity.js'

/**
 * @typedef {import('./baseEntity.js').BaseEntity} BaseEntity
 */

/**
 * @typedef {Object} SkillCheckSuccessFields
 * @property {string} name - Success name
 * @property {string} description - Success description
 */

/**
 * @typedef {BaseEntity & SkillCheckSuccessFields} SkillCheckSuccess
 */

/**
 * Creates a new default SkillCheckSuccess
 * @returns {SkillCheckSuccess}
 */
export function createDefaultSkillCheckSuccess() {
  return {
    ...createBaseEntity(),
    name: 'New Skill Check Success',
    description: '',
  }
}
