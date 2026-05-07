import { createBaseEntity } from './baseEntity.js'

/**
 * @typedef {import('./baseEntity.js').BaseEntity} BaseEntity
 */

/**
 * @typedef {Object} EquipmentSubtypeFields
 * @property {string} name - Subtype name
 * @property {UUID|null} parentTypeId - Parent equipment type UUID reference
 * @property {string} description - Subtype description
 * @property {number} index - Sort order index
 */

/**
 * @typedef {BaseEntity & EquipmentSubtypeFields} EquipmentSubtype
 */

/**
 * Creates a new default EquipmentSubtype
 * @returns {EquipmentSubtype}
 */
export function createDefaultEquipmentSubtype() {
  return {
    ...createBaseEntity(),
    name: 'New Subtype',
    parentTypeId: null,
    description: '',
    index: 0,
  }
}
