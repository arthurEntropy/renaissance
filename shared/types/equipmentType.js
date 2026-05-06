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
  const baseEntity = createBaseEntity()

  return {
    // Base entity fields
    id: baseEntity.id,
    isDeleted: baseEntity.isDeleted,
    createdAt: baseEntity.createdAt,
    lastModified: baseEntity.lastModified,

    // Equipment type fields
    name: 'New Type',
    description: '',
    index: 0,
  }
}
