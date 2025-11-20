import { EQUIPMENT_TYPES } from '../constants/equipmentTypes.js'

/**
 * Check if an equipment item is a weapon based on its type
 * @param {Object} equipment - The equipment object
 * @returns {boolean} True if the equipment is a weapon, false otherwise
 */
export const isWeapon = (equipment) => {
  return equipment?.type === EQUIPMENT_TYPES.WEAPON
}

/**
 * Check if an equipment item is armor based on its type
 * @param {Object} equipment - The equipment object
 * @returns {boolean} True if the equipment is armor, false otherwise
 */
export const isArmor = (equipment) => {
  return equipment?.type === EQUIPMENT_TYPES.ARMOR
}

/**
 * Check if an equipment item is a general item based on its type
 * @param {Object} equipment - The equipment object
 * @returns {boolean} True if the equipment is an item, false otherwise
 */
export const isItem = (equipment) => {
  return equipment?.type === EQUIPMENT_TYPES.ITEM
}
