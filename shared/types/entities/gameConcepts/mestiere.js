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
 * @property {NovizioMartialTraining} martial - Martial training expressed as arrays of equipment grade IDs
 * @property {string} martialNotes - Special cases or conditions for martial training (rich text)
 * @property {Object.<string, number>} engagementDice - Map of die size (as string) to count, e.g. { "6": 2, "8": 1 }
 * @property {string} engagementNotes - Special cases or conditions for engagement dice (rich text)
 * @property {string[]} engagementSuccesses - IDs of selectable engagement successes
 * @property {string} engagementSuccessNotes - Special cases or conditions for engagement successes (rich text)
 * @property {number} baseMP - Starting base Mestieri Points
 * @property {string} mpNotes - Notes about MP (rich text)
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
