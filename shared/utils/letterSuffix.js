/**
 * Converts a 0-based index to an alphabetical suffix: 0→A, 1→B, …, 25→Z, 26→AA, etc.
 * Used to generate unique names for beast instances (e.g. "Wolf A", "Wolf B", "Wolf AA").
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
