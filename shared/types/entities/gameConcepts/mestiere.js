import { createDefaultGameConcept } from './gameConcept.js'

/**
 * @typedef {import('./gameConcept.js').GameConcept} Mestiere
 */

/**
 * Creates a new default Mestiere
 * @returns {Mestiere}
 */
export function createDefaultMestiere() {
  return createDefaultGameConcept('Mestiere')
}
