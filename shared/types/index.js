/**
 * Shared entity type definitions and factory functions
 * Used by both frontend and backend to ensure data consistency
 */

// Base entity type
export { createBaseEntity } from './baseEntity.js'

// Dice types (used across multiple entities)
export * from './dice.js'

// Game concept entities (includes gameConcept base)
export { createDefaultGameConcept } from './gameConcept.js'
export { createDefaultAncestry } from './ancestry.js'
export { createDefaultCulture } from './culture.js'
export { createDefaultMestiere } from './mestiere.js'
export { createDefaultWorldElement } from './worldElement.js'

// Equipment entities
export { createDefaultEquipment } from './equipment.js'
export { createDefaultEquipmentType } from './equipmentType.js'
export { createDefaultEquipmentSubtype } from './equipmentSubtype.js'
export { createDefaultEquipmentGrade } from './equipmentGrade.js'
export { createDefaultEquipmentRange } from './equipmentRange.js'

// Other entities
export { createDefaultBiome } from './biome.js'
export { createDefaultAbility } from './ability.js'
export { createDefaultAbilitySchool } from './abilitySchool.js'
export { createDefaultArt } from './art.js'
export {
	createDefaultCharacter,
	createDefaultPlayerCharacter,
	createDefaultNPC,
	createDefaultBeast,
	createDefaultBeastInstance,
} from './character.js'
export { createDefaultEngagementSuccess } from './engagementSuccess.js'
export { createDefaultExpansion } from './expansion.js'
export { createDefaultKeeping } from './keeping.js'
export { createDefaultArtPlaceholder } from './artPlaceholder.js'
export { createDefaultRulesSection } from './rulesSection.js'
export { createDefaultUser } from './user.js'
export { createDefaultCampaign } from './campaign.js'
