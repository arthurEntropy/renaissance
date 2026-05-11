/**
 * @param {Object | null | undefined} character
 * @returns {'playerCharacter' | 'npc' | 'beast' | 'beastInstance'}
 */
export function getCharacterType(character) {
  if (character?.characterType === 'player') return 'playerCharacter'
  return typeof character?.characterType === 'string' ? character.characterType : 'playerCharacter'
}

/**
 * @param {Object | null | undefined} character
 * @returns {boolean}
 */
export function isPlayerCharacter(character) {
  return getCharacterType(character) === 'playerCharacter'
}

/**
 * @param {Object | null | undefined} character
 * @returns {boolean}
 */
export function isNPC(character) {
  return getCharacterType(character) === 'npc'
}

/**
 * @param {Object | null | undefined} character
 * @returns {boolean}
 */
export function isBeastTemplate(character) {
  return getCharacterType(character) === 'beast'
}

/**
 * @param {Object | null | undefined} character
 * @returns {boolean}
 */
export function isBeastInstance(character) {
  return getCharacterType(character) === 'beastInstance'
}
