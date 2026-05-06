import { createBaseEntity } from '../gameEntity.js'

/**
 * @typedef {import('../gameEntity.js').GameEntity} GameEntity
 */

/**
 * @typedef {Object} EquipmentGradeFields
 * @property {string} name - Grade name (e.g., "Common", "Martial", "Great")
 * @property {string} description - Grade description
 * @property {number} index - Sort order index
 */

/**
 * @typedef {GameEntity & EquipmentGradeFields} EquipmentGrade
 */

/**
 * Creates a new default EquipmentGrade
 * @returns {EquipmentGrade}
 */
export function createDefaultEquipmentGrade() {
  const baseEntity = createBaseEntity()

  return {
    // Base entity fields
    id: baseEntity.id,
    isDeleted: baseEntity.isDeleted,
    createdAt: baseEntity.createdAt,
    lastModified: baseEntity.lastModified,

    // Equipment grade fields
    name: 'New Equipment Grade',
    description: '',
    index: 0,
  }
}
