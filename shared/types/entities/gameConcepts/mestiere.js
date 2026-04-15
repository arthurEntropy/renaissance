import { createDefaultGameConcept, ConceptType } from './gameConcept.js'

/**
 * @typedef {Object} NovizioMartialTraining
 * @property {string[]} melee - Grade IDs the mestiere is proficient with for melee weapons
 * @property {string[]} polearm - Grade IDs the mestiere is proficient with for polearms
 * @property {string[]} ranged - Grade IDs the mestiere is proficient with for ranged weapons
 * @property {string[]} firearm - Grade IDs the mestiere is proficient with for firearms
 * @property {string[]} armor - Grade IDs the mestiere is proficient with for armor (includes shields and helms)
 */

/**
 * @typedef {Object} Novizio
 * @property {string} flavorText - Introductory flavor text
 * @property {NovizioMartialTraining} - Martial training expressed as arrays of equipment grade IDs
 * @property {string} engagement - Engagement dice description (rich text)
 * @property {number} baseMP - Starting base Mestieri Points
 * @property {string} abilities - Starting abilities description (rich text)
 */

/**
 * @typedef {import('./gameConcept.js').GameConcept & { novizio?: Novizio }} Mestiere
 */

/**
 * Creates a new default Mestiere
 * @returns {Mestiere}
 */
export function createDefaultMestiere() {
  return createDefaultGameConcept(ConceptType.MESTIERE)
}
