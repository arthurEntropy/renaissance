/**
 * Utilities for determining martial training requirements and checking
 * whether a character meets them for a given equipment item.
 *
 * These functions accept plain data rather than store references so they can
 * be used from composables, services, and components alike.
 */

/**
 * Returns the martial-training category key that applies to the given
 * equipment item, or null if the item doesn't require training.
 *
 * @param {Object} params
 * @param {string|null} params.equipmentTypeId   - The equipment's type ID (raw)
 * @param {string|null} params.equipmentTypeName - Resolved type name (e.g. "Weapon" or "Armor")
 * @param {string|null} params.equipmentSubtypeName - Resolved subtype name (e.g. "Melee", "Ranged")
 * @param {string}      params.armorTypeId        - The canonical Armor type ID constant
 * @returns {string|null}  One of 'armorGrades', 'meleeGrades', 'polearmGrades',
 *                         'rangedGrades', 'firearmGrades', or null.
 */
export function getMartialTrainingKey({ equipmentTypeId, equipmentTypeName, equipmentSubtypeName, armorTypeId }) {
  if (equipmentTypeId === armorTypeId) return 'armorGrades'
  if (equipmentTypeName?.toLowerCase() === 'weapon') {
    const name = equipmentSubtypeName?.toLowerCase()
    if (name && ['melee', 'polearm', 'ranged', 'firearm'].includes(name)) {
      return `${name}Grades`
    }
  }
  return null
}

/**
 * Returns true when the character lacks the martial training required to
 * use the given equipment item without penalty.
 *
 * @param {Object}      params
 * @param {Object|null} params.character        - The character object
 * @param {string|null} params.trainingKey      - Key returned by getMartialTrainingKey
 * @param {string|null} params.equipmentGradeId - The equipment's grade ID
 * @param {Object|null} params.mestiere         - The character's full mestiere concept object
 * @returns {boolean}
 */
export function characterLacksTraining({ character, trainingKey, equipmentGradeId, mestiere }) {
  if (!character || !trainingKey || !equipmentGradeId) return false
  const mestiereGrades = mestiere?.novizio?.martialTraining?.[trainingKey] ?? []
  const manualGrades = character.martialTrainingOverrides?.[trainingKey] ?? []
  const trainedGrades = [...new Set([...mestiereGrades, ...manualGrades])]
  return !trainedGrades.includes(equipmentGradeId)
}
