
 // Utility functions for DiceFont CSS class generation

export function getDiceFontClass(dieSize, value) {
  return `df-d${dieSize}-${value}`
}

export function getDiceFontMaxClass(dieSize) {
  return getDiceFontClass(dieSize, dieSize)
}

export function parseDiceFontClass(diceClass) {
  const match = diceClass.match(/df-d(\d+)-(\d+)/) // Matches "df-d6-4" format
  if (match) {
    return {
      dieSize: parseInt(match[1], 10),
      value: parseInt(match[2], 10)
    }
  }
  return null
}

export function getRandomDiceFontClass(dieSize) {
  const randomValue = Math.floor(Math.random() * dieSize) + 1
  return getDiceFontClass(dieSize, randomValue)
}

export default {
  getDiceFontClass,
  getDiceFontMaxClass,
  parseDiceFontClass,
  getRandomDiceFontClass
}
