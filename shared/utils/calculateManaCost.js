import { parseManaCost } from './parseManaCost'
import { ManaColor } from '../constants/manaColors'

export function calculateTotalManaCost(manaCost) {
  if (!manaCost) return 0
  
  const parsed = parseManaCost(manaCost)
  let total = 0
  
  for (const symbol of parsed) {
    if (symbol.type === ManaColor.COLORLESS) {
      total += parseInt(symbol.value, 10)
    } else {
      total += 1
    }
  }
  
  return total
}

export function getManaCostColors(manaCost) {
  if (!manaCost) return new Set()
  
  const parsed = parseManaCost(manaCost)
  const colors = new Set()
  
  for (const symbol of parsed) {
    if (symbol.type !== ManaColor.COLORLESS) {
      colors.add(symbol.type)
    }
  }
  
  return colors
}
