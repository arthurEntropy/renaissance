/**
 * Shared entity type definitions and factory functions
 * Used by both frontend and backend to ensure data consistency
 */

// Base entity type
export * from './entities/gameEntity.js'

// Dice types (used across multiple entities)
export * from './dice.js'

// Game concept entities (includes gameConcept base)
export * from './entities/gameConcepts/gameConcept.js'
export * from './entities/gameConcepts/ancestry.js'
export * from './entities/gameConcepts/culture.js'
export * from './entities/gameConcepts/mestiere.js'
export * from './entities/gameConcepts/worldElement.js'

// Equipment entities
export * from './entities/equipment/equipment.js'
export * from './entities/equipment/equipmentType.js'
export * from './entities/equipment/equipmentSubtype.js'
export * from './entities/equipment/equipmentGrade.js'
export * from './entities/equipment/equipmentRange.js'

// Other entities
export * from './entities/ability.js'
export * from './entities/art.js'
export * from './entities/backgroundImage.js'
export * from './entities/character.js'
export * from './entities/engagementSuccess.js'
export * from './entities/expansion.js'
export * from './entities/keeping.js'
export * from './entities/rulesSection.js'
export * from './entities/user.js'
