import { createDefaultGameConcept, ConceptType } from './gameConcept.js'

/** @typedef {import('./dice.js').Die} Die */
/** @typedef {import('./engagementSuccess.js').EngagementSuccess} EngagementSuccess */

/**
 * @typedef {Object} NovizioMartialTraining
 * @property {UUID[]} meleeGrades - IDs for the grades of melee weapons the mestiere is proficient with
 * @property {UUID[]} polearmGrades - IDs for the grades of polearms the mestiere is proficient with
 * @property {UUID[]} rangedGrades - IDs for the grades of ranged weapons the mestiere is proficient with
 * @property {UUID[]} firearmGrades - IDs for the grades of firearms the mestiere is proficient with
 * @property {UUID[]} armorGrades - IDs for the grades of armor the mestiere is proficient with
 */

/**
 * @typedef {Object} Novizio
 * @property {string} description - Description of the mestiere's novizio
 * @property {NovizioMartialTraining} martialTraining - Martial training expressed as arrays of equipment grade IDs
 * @property {string} martialTrainingNotes - Notes about martial training
 * @property {Die[]} engagementDice - Engagement dice granted by this novizio
 * @property {string} engagementDiceNotes - Special cases or conditions for engagement dice (rich text)
 * @property {EngagementSuccess[]} engagementSuccesses - Engagement successes granted by this novizio
 * @property {string} engagementSuccessNotes - Special cases or conditions for engagement successes (rich text)
 * @property {number} baseMP - Starting base Mestieri Points
 * @property {string} baseMpNotes - Notes about MP (rich text)
 * @property {string} abilities - Starting abilities description (rich text)
 * @property {string} gratuiti - Starting gratuiti description (rich text)
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
