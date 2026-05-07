import { createDefaultGameConcept, ConceptType } from './gameConcept.js'

/**
 * @typedef {import('./gameConcept.js').GameConcept} GameConcept
 */

/**
 * @typedef {Object} WorldElementFields
 */

/**
 * @typedef {GameConcept & WorldElementFields} WorldElement
 */

/**
 * Creates a new default WorldElement
 * @returns {WorldElement}
 */
export function createDefaultWorldElement() {
  return createDefaultGameConcept(ConceptType.WORLD_ELEMENT)
}
