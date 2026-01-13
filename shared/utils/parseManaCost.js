// Utility to parse mana cost strings like '2WUB'
import { ManaColor } from '../constants/manaColors'

const symbolMap = {
  W: ManaColor.WHITE,
  U: ManaColor.BLUE,
  B: ManaColor.BLACK,
  R: ManaColor.RED,
  G: ManaColor.GREEN,
}

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
    } else if (symbolMap[char]) {
      result.push({ type: symbolMap[char], value: char })
    }
    i++
  }
  return result
}
