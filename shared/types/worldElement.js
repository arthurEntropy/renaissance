import { createDefaultGameConcept } from './gameConcept.js'
import { ConceptType } from '../constants/conceptTypes.js'

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
