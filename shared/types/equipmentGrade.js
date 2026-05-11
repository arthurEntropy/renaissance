import { createBaseEntity } from './baseEntity.js'

/**
 * @typedef {import('./baseEntity.js').BaseEntity} BaseEntity
 */

/**
 * @typedef {Object} EquipmentGradeFields
 * @property {string} name - Grade name (e.g., "Common", "Martial", "Great")
 * @property {string} description - Grade description
 * @property {number} index - Sort order index
 */

/**
 * @typedef {BaseEntity & EquipmentGradeFields} EquipmentGrade
 */

/**
 * Creates a new default EquipmentGrade
 * @returns {EquipmentGrade}
 */
export function createDefaultEquipmentGrade() {
  return {
    ...createBaseEntity(),
    name: 'New Equipment Grade',
    description: '',
    index: 0,
  }
}
