/**
 * Concept Type Enumeration
 * Defines the different types of game concepts in the system
 */
export const ConceptType = {
  ANCESTRY: 'ANCESTRY',
  CULTURE: 'CULTURE',
  MESTIERE: 'MESTIERE',
  WORLD_ELEMENT: 'WORLD_ELEMENT'
}

/**
 * Human-readable labels for each concept type
 */
export const CONCEPT_TYPE_LABELS = {
  [ConceptType.ANCESTRY]: 'Ancestry',
  [ConceptType.CULTURE]: 'Culture',
  [ConceptType.MESTIERE]: 'Mestiere',
  [ConceptType.WORLD_ELEMENT]: 'World Element'
}

/**
 * Plural forms for each concept type
 */
export const CONCEPT_TYPE_PLURALS = {
  [ConceptType.ANCESTRY]: 'Ancestries',
  [ConceptType.CULTURE]: 'Cultures',
  [ConceptType.MESTIERE]: 'Mestieri',
  [ConceptType.WORLD_ELEMENT]: 'World Elements'
}

/**
 * Validate if a string is a valid concept type
 * @param {string} type - The type to validate
 * @returns {boolean} True if valid concept type
 */
export function isValidConceptType(type) {
  return Object.values(ConceptType).includes(type)
}

/**
 * Get label for a concept type
 * @param {string} conceptType - The concept type
 * @returns {string} Human-readable label
 */
export function getConceptTypeLabel(conceptType) {
  return CONCEPT_TYPE_LABELS[conceptType] || conceptType
}

/**
 * Get plural label for a concept type
 * @param {string} conceptType - The concept type
 * @returns {string} Plural form
 */
export function getConceptTypePlural(conceptType) {
  return CONCEPT_TYPE_PLURALS[conceptType] || conceptType
}
