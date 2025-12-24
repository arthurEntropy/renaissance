import { createBaseEntity } from '../gameEntity.js'
import { ConceptType, getConceptTypeLabel } from '../../../constants/conceptTypes.js'

/**
 * Base structure for game concepts (Ancestry, Culture, Mestiere, WorldElement)
 * These all share the same fundamental structure
 *
 * @typedef {Object} GameConcept
 * @property {string|null} id - UUID identifier
 * @property {string} conceptType - Type of concept (ANCESTRY, CULTURE, MESTIERE, WORLD_ELEMENT)
 * @property {string} name - Concept name
 * @property {string} description - Detailed description
 * @property {boolean} isDeleted - Soft delete flag
 * @property {string[]} artUrls - Associated artwork URLs
 * @property {string[]} faces - Character face art IDs
 * @property {string[]} places - Location art IDs
 * @property {string} backgroundImage - Background image URL
 * @property {string} expansion - Expansion ID this concept belongs to
 * @property {string[]} hooks - Story hooks and prompts
 * @property {string[]} playlists - Associated music playlists
 * @property {string} names - Example names and naming conventions
 * @property {string} occupations - Typical occupations
 * @property {string} publicHouses - Public houses and gathering places
 * @property {string} vittles - Food and drink descriptions
 * @property {string} pointsOfInterest - Notable locations
 * @property {string} floraFauna - Native flora and fauna
 * @property {string} createdAt - ISO 8601 datetime string
 * @property {string} lastModified - ISO 8601 datetime string
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
    artUrls: ['https://cdn.midjourney.com/a8a36740-b7d3-4aef-bea3-a95039bec06f/0_2.png'],
    faces: [],
    places: [],
    backgroundImage: '',
    expansion: '',
    hooks: [],
    playlists: [],
    names: '',
    occupations: '',
    publicHouses: '',
    vittles: '',
    pointsOfInterest: '',
    floraFauna: '',
  }
}

// Re-export ConceptType for convenience
export { ConceptType }
