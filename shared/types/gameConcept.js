import { createBaseEntity } from './baseEntity.js'
import { ConceptType, getConceptTypeLabel } from '../constants/conceptTypes.js'

/**
 * @typedef {import('./baseEntity.js').BaseEntity} BaseEntity
 */

/**
 * Base structure for game concepts (Ancestry, Culture, Mestiere, WorldElement)
 * These all share the same fundamental structure
 */

/**
 * @typedef {Object} GameConceptFields
 * @property {string} conceptType - Type of concept (ANCESTRY, CULTURE, MESTIERE, WORLD_ELEMENT)
 * @property {string} name - Concept name
 * @property {HTMLString} description - Concept description
 * @property {string[]} featuredArtUrls - Image URLs for the concept's featured art
 * @property {string} backgroundImage - Image URL for the background of the concept's detail page
 * @property {string} cardBackgroundImage - Image URL for the background of the concept's ability and equipment cards
 * @property {UUID} expansion - Expansion ID this concept belongs to
 */

/**
 * @typedef {BaseEntity & GameConceptFields} GameConcept
 */

/**
 * Creates a new default GameConcept
 * @param {string} conceptType - The type of concept (use ConceptType enum)
 * @returns {GameConcept}
 */
export function createDefaultGameConcept(conceptType) {
  if (!conceptType) {
    throw new Error('conceptType is required when creating a GameConcept')
  }
  
  const label = getConceptTypeLabel(conceptType)
  
  return {
    ...createBaseEntity(),
    conceptType,
    name: `New ${label}`,
    description: '',
    featuredArtUrls: ['https://cdn.midjourney.com/a8a36740-b7d3-4aef-bea3-a95039bec06f/0_2.png'],
    backgroundImage: '',
    cardBackgroundImage: '',
    expansion: '',
  }
}

// Re-export ConceptType for convenience
export { ConceptType }
