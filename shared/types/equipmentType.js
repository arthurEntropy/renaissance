import { createBaseEntity } from './baseEntity.js'

/**
 * @typedef {import('./baseEntity.js').BaseEntity} BaseEntity
 */

/**
 * @typedef {Object} EquipmentTypeFields
 * @property {string} name - Type name
 * @property {string} description - Type description
 * @property {number} index - Sort order index
 */

/**
 * @typedef {BaseEntity & EquipmentTypeFields} EquipmentType
 */

/**
 * Creates a new default EquipmentType
 * @returns {EquipmentType}
 */
export function createDefaultEquipmentType() {
  return {
    ...createBaseEntity(),
    name: 'New Type',
    description: '',
    index: 0,
  }
}
