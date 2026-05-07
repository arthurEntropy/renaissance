import { createDefaultGameConcept, ConceptType } from './gameConcept.js'

/**
 * @typedef {import('./gameConcept.js').GameConcept} GameConcept
 */

/**
 * @typedef {Object} Hook
 * @property {UUID} id - Unique identifier for the hook
 * @property {string} name - Hook name/title
 * @property {HTMLString} description - Hook description
 * @property {HTMLString} gmNotes - GM-only notes
 * @property {number} index - Order index for sorting
 */

/**
 * @typedef {Object} LocalFlavor
 * @property {string} names - Typical first names
 * @property {string} occupations - Typical occupations
 * @property {string} publicHouses - Public houses and gathering places
 * @property {string} vittles - Typical food and drink
 * @property {string} pointsOfInterest - Notable locations
 * @property {string} floraFauna - Native flora and fauna
 */

/**
 * @typedef {Object} CultureFields
 * @property {string[]} playlists - Associated music playlists
 * @property {Hook[]} hooks - Story hooks and prompts
 * @property {LocalFlavor} localFlavor - Culture-specific flavor text and details
 */

/**
 * @typedef {GameConcept & CultureFields} Culture
 */

/**
 * Creates a new default Culture
 * @returns {Culture}
 */
export function createDefaultCulture() {
  return {
    ...createDefaultGameConcept(ConceptType.CULTURE),
    playlists: [],
    hooks: [],
    localFlavor: {
      names: '',
      occupations: '',
      publicHouses: '',
      vittles: '',
      pointsOfInterest: '',
      floraFauna: '',
    },
  }
}
