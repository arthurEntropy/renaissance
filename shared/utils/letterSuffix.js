/**
 * Converts a 0-based index to an alphabetical suffix: 0→A, 1→B, …, 25→Z, 26→AA, etc.
 * @param {number} index
 * @returns {string}
 */
export function toLetterSuffix(index) {
  let n = index + 1
  let suffix = ''
  while (n > 0) {
    const remainder = (n - 1) % 26
    suffix = String.fromCharCode(65 + remainder) + suffix
    n = Math.floor((n - 1) / 26)
  }
  return suffix
}

// Unicode code point of 🅐 (Negative Circled Latin Capital Letter A)
const CIRCLED_A = 0x1F150

/**
 * Returns true if the string consists entirely of Negative Circled Latin Capital
 * Letters (🅐–🅩, U+1F150–U+1F169).
 * @param {string} str
 * @returns {boolean}
 */
function isCircledLetters(str) {
  if (!str) return false
  // Check using surrogate pairs (circled letters are in the supplementary plane,
  // so each glyph is two UTF-16 code units: a high surrogate + a low surrogate).
  const chars = [...str] // split by Unicode scalar value
  if (chars.length === 0) return false
  for (const ch of chars) {
    // codePointAt on a well-formed string always returns a number for the first position
    const cp = ch.codePointAt(0)
    if (!cp || cp < CIRCLED_A || cp > CIRCLED_A + 25) return false
  }
  return true
}

/**
 * Extracts the circled-letter suffix from a beast instance name, or returns null.
 * e.g. extractCircledSuffix('Wolf 🅐', 'Wolf') → '🅐'
 * @param {string} name
 * @param {string} baseName
 * @returns {string|null}
 */
export function extractCircledSuffix(name, baseName) {
  if (typeof name !== 'string' || typeof baseName !== 'string') return null
  const prefix = `${baseName} `
  if (!name.startsWith(prefix)) return null
  const suffix = name.slice(prefix.length)
  return isCircledLetters(suffix) ? suffix : null
}

/**
 * Picks a random circled-letter suffix (🅐–🅩, 🅐🅐–🅩🅩, …) that is not already
 * used by any of the provided beast instances.
 *
 * @param {Array<{name?: string}>} instances - Existing instances to check against
 * @param {string} baseName - Template base name (e.g. "Wolf")
 * @returns {string} A single unused circled-letter suffix
 */
export function pickNextCircledSuffix(instances, baseName) {
  const usedSuffixes = new Set()
  for (const inst of instances) {
    const suffix = extractCircledSuffix(inst.name ?? '', baseName)
    if (suffix) usedSuffixes.add(suffix)
  }

  // Try single letters first (26 options)
  const singleLetters = Array.from({ length: 26 }, (_, i) =>
    String.fromCodePoint(CIRCLED_A + i)
  )
  const availableSingle = singleLetters.filter(l => !usedSuffixes.has(l))
  if (availableSingle.length > 0) {
    return availableSingle[Math.floor(Math.random() * availableSingle.length)]
  }

  // All 26 single letters used — try double letters (676 options)
  const doubleLetters = []
  for (let i = 0; i < 26; i++) {
    for (let j = 0; j < 26; j++) {
      doubleLetters.push(
        String.fromCodePoint(CIRCLED_A + i) + String.fromCodePoint(CIRCLED_A + j)
      )
    }
  }
  const availableDouble = doubleLetters.filter(l => !usedSuffixes.has(l))
  if (availableDouble.length > 0) {
    return availableDouble[Math.floor(Math.random() * availableDouble.length)]
  }

  // All 702 options used — triple letters (very unlikely in practice)
  const tripleLetters = []
  for (let i = 0; i < 26; i++) {
    for (let j = 0; j < 26; j++) {
      for (let k = 0; k < 26; k++) {
        tripleLetters.push(
          String.fromCodePoint(CIRCLED_A + i) +
          String.fromCodePoint(CIRCLED_A + j) +
          String.fromCodePoint(CIRCLED_A + k)
        )
      }
    }
  }
  const availableTriple = tripleLetters.filter(l => !usedSuffixes.has(l))
  if (availableTriple.length > 0) {
    return availableTriple[Math.floor(Math.random() * availableTriple.length)]
  }

  // Absolute fallback (should never be reached)
  return String.fromCodePoint(CIRCLED_A + Math.floor(Math.random() * 26))
}
