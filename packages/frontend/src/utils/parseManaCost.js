// Utility to parse mana cost strings like '2WUB'
import { ManaColor, MANA_SYMBOL_TO_COLOR } from '@/constants/manaColors'

/**
 * @param {string | null | undefined} cost
 */
export function parseManaCost(cost) {
  if (!cost) return []
  const result = []
  let i = 0
  while (i < cost.length) {
    const char = cost[i]
    if (/[0-9]/.test(char)) {
      // Colorless/any mana (may be more than one digit)
      let num = char
      while (i + 1 < cost.length && /[0-9]/.test(cost[i + 1])) {
        num += cost[++i]
      }
      result.push({ type: ManaColor.COLORLESS, value: num })
    } else if (char.toUpperCase() === 'X') {
      result.push({ type: ManaColor.COLORLESS, value: 'X' })
    } else {
      const normalized = char.toUpperCase()
      if (MANA_SYMBOL_TO_COLOR[normalized]) {
        result.push({ type: MANA_SYMBOL_TO_COLOR[normalized], value: normalized })
      }
    }
    i++
  }
  return result
}