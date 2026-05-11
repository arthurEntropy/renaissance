import { createDefaultGameConcept } from './gameConcept.js'
import { ConceptType } from '../constants/conceptTypes.js'

/**
 * @typedef {import('./gameConcept.js').GameConcept} GameConcept
 */

/**
 * @typedef {Object} Physiology
 * @property {number} heightMin - Minimum height
 * @property {number} heightMax - Maximum height
 * @property {number} weightMin - Minimum weight
 * @property {number} weightMax - Maximum weight
 * @property {number} lifespan - Typical lifespan in years (0 = undying)
 * @property {number} speed - Base speed
 */

/**
 * @typedef {Object} AncestryFields
 * @property {Physiology} physiology - Physical characteristics
 */

/**
 * @typedef {GameConcept & AncestryFields} Ancestry
 */

/**
 * Creates a new default Ancestry
 * @returns {Ancestry}
 */
export function createDefaultAncestry() {
  return {
    ...createDefaultGameConcept(ConceptType.ANCESTRY),
    physiology: {
      heightMin: 0,
      heightMax: 0,
      weightMin: 0,
      weightMax: 0,
      lifespan: 0,
      speed: 30,
    },
  }
}
