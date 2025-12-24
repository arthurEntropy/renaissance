export const ConceptType = {
  ANCESTRY: 'ANCESTRY',
  CULTURE: 'CULTURE',
  MESTIERE: 'MESTIERE',
  WORLD_ELEMENT: 'WORLD_ELEMENT'
}

export const CONCEPT_TYPE_LABELS = {
  [ConceptType.ANCESTRY]: 'Ancestry',
  [ConceptType.CULTURE]: 'Culture',
  [ConceptType.MESTIERE]: 'Mestiere',
  [ConceptType.WORLD_ELEMENT]: 'World Element'
}

export const CONCEPT_TYPE_PLURALS = {
  [ConceptType.ANCESTRY]: 'Ancestries',
  [ConceptType.CULTURE]: 'Cultures',
  [ConceptType.MESTIERE]: 'Mestieri',
  [ConceptType.WORLD_ELEMENT]: 'World Elements'
}

export function isValidConceptType(type) {
  return Object.values(ConceptType).includes(type)
}

export function getConceptTypeLabel(conceptType) {
  return CONCEPT_TYPE_LABELS[conceptType] || conceptType
}

export function getConceptTypePlural(conceptType) {
  return CONCEPT_TYPE_PLURALS[conceptType] || conceptType
}
