import { createDefaultGameConcept } from './gameConcept.js'

/**
 * @typedef {import('./gameConcept.js').GameConcept} Ancestry
 */

/**
 * Creates a new default Ancestry
 * @returns {Ancestry}
 */
export function createDefaultAncestry() {
  return createDefaultGameConcept('Ancestry')
}
