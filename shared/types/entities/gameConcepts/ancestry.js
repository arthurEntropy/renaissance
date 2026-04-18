import { createDefaultGameConcept, ConceptType } from './gameConcept.js'

/**
 * @typedef {import('./gameConcept.js').GameConcept & {
 *   heightMin: number,
 *   heightMax: number,
 *   weightMin: number,
 *   weightMax: number,
 *   lifespan: string,
 *   speed: number,
 * }} Ancestry
 */

/**
 * Creates a new default Ancestry
 * @returns {Ancestry}
 */
export function createDefaultAncestry() {
  return {
    ...createDefaultGameConcept(ConceptType.ANCESTRY),
    heightMin: 0,
    heightMax: 0,
    weightMin: 0,
    weightMax: 0,
    lifespan: '',
    speed: 30,
  }
}
