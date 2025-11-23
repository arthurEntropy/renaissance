import { createDefaultGameConcept } from './gameConcept.js'

/**
 * @typedef {import('./gameConcept.js').GameConcept} WorldElement
 */

/**
 * Creates a new default WorldElement
 * @returns {WorldElement}
 */
export function createDefaultWorldElement() {
  return createDefaultGameConcept('World Element')
}
