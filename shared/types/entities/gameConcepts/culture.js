import { createDefaultGameConcept } from './gameConcept.js'

/**
 * @typedef {import('./gameConcept.js').GameConcept} Culture
 */

/**
 * Creates a new default Culture
 * @returns {Culture}
 */
export function createDefaultCulture() {
  return createDefaultGameConcept('Culture')
}
