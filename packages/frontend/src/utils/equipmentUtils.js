import { EQUIPMENT_TYPES } from '../constants/equipmentTypes.js'

export const isWeapon = (equipment) => {
  return equipment?.type === EQUIPMENT_TYPES.WEAPON
}

export const isArmor = (equipment) => {
  return equipment?.type === EQUIPMENT_TYPES.ARMOR
}

export const isItem = (equipment) => {
  return equipment?.type === EQUIPMENT_TYPES.ITEM
}
