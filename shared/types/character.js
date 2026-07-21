import { SKILLS } from '../constants/characterConstants.js'
import { createBaseEntity } from './baseEntity.js'

/**
 * @typedef {import('./baseEntity.js').BaseEntity} BaseEntity
 * @typedef {import('./dice.js').DieSize} DieSize
 */

/**
 * @typedef {Object} Skill
 * @property {string} key - Stable skill identifier
 * @property {number} ranks - Number of ranks in this skill
 * @property {boolean} isFavored - Whether this skill is favored
 * @property {boolean} isIllFavored - Whether this skill is ill-favored
 * @property {number} diceMod - Dice modifier from conditions/states/effects (auto-calculated)
 * @property {number} manualDiceMod - Manual dice modifier set by user via the UI
 */

/**
 * @typedef {Object} StatPool
 * @property {number} current - Current value
 * @property {number} base - Base value
 */

/**
 * @typedef {Object} CharacterStates
 * @property {boolean} weary - Whether the character is weary
 * @property {boolean} twiceWeary - Whether the character is twice weary
 * @property {boolean} miserable - Whether the character is miserable
 * @property {boolean} twiceMiserable - Whether the character is twice miserable
 * @property {boolean} helpless - Whether the character is helpless
 * @property {boolean} twiceHelpless - Whether the character is twice helpless
 */

/**
 * @typedef {Object} CharacterConditions
 * @property {boolean} insecure - Whether the character is insecure
 * @property {boolean} guilty - Whether the character is guilty
 * @property {boolean} angry - Whether the character is angry
 * @property {boolean} afraid - Whether the character is afraid
 * @property {boolean} troubled - Whether the character is troubled
 */

/**
 * @typedef {Object} CharacterEquipment
 * @property {UUID} id - Equipment ID reference
 * @property {number} quantity - Number of items
 * @property {boolean} isCarried - Whether item is currently carried
 * @property {boolean} [isWielding] - Whether item is currently wielded or worn
 * @property {number|null} [difficulty] - Set difficulty for the item
 * 
 * // Display properties
 * @property {number} index - Display order index
 * @property {boolean} collapsed - Whether item display is collapsed in UI
 * @property {boolean} artExpanded - Whether art view is expanded in UI
 * @property {number} [columnIndex] - Column index (0-2) in the three-column layout
 * @property {UUID|null} [customGroupId] - ID of the custom group this item belongs to
 * 
 * // Mesmer's mask
 * @property {UUID|null} [pendingDiscoveryAbilityId] - Ability pre-selected for Mesmer's Mask discovery, persisted until claimed
 * @property {number|null} [discoveryNumber] - Discovery roll result tracked for Mesmer's Mask workflow
 */

/**
 * @typedef {Object} CharacterAbility
 * @property {UUID} id - Ability ID reference
 * @property {boolean} collapsed - Whether ability display is collapsed in UI
 * @property {boolean} showImprovements - Whether improvements section is expanded in UI
 * @property {boolean} showSuccesses - Whether successes section is expanded in UI
 * @property {Object.<UUID, boolean>} [improvements] - Map of improvement IDs to ownership status
 * @property {number} [columnIndex] - Column index (0-2) in the three-column layout
 * @property {UUID|null} [customGroupId] - ID of the custom group this ability belongs to
 * @property {number|null} [difficulty] - Set difficulty for abilities that allow one
 * @property {boolean} [isActive] - Whether this ability is currently active (ongoing effect tracking)
 */

/**
 * @typedef {Object} WitchcraftToken
 * @property {UUID} id - Local UUID
 * @property {UUID|null} abilityId - ID of the spell ability stored in this token
 * @property {boolean} [isTalisman] - Whether this entry is a talisman (true) instead of a token (false/default)
 * @property {string} imageUrl - Icon path or custom image URL
 * @property {string} givenTo - Who currently holds this token
 * @property {string} notes - Optional notes (e.g. contingency triggers)
 */

/**
 * @typedef {Object} HunterTrap
 * @property {UUID} id - Local UUID
 * @property {string} imageUrl - Icon path or custom image URL
 * @property {number|null} difficulty - The set Difficulty for the trap (null if not set)
 */

/**
 * @typedef {Object} SummonerVessel
 * @property {UUID} id - Local UUID
 * @property {UUID|null} beastId - ID of the captured beast character (null if vessel is empty)
 * @property {number} friendship - 0–10 friendship score with the captured beast
 * @property {boolean} isActive - Whether this vessel is chosen as active for the current per-rest period
 * @property {boolean} isSummoned - Whether the creature is currently out of its vessel
 * @property {UUID|null} keeping - ID of the Keeping that determines the vessel's quality tier
 * @property {string} vesselNote - Optional player description of the physical vessel object
 * @property {string} imageUrl - Icon path for the vessel
 */

/**
 * @typedef {Object} AutoCalculationsSettings
 * @property {boolean} load - Whether to auto-calculate load
 * @property {boolean} states - Whether to auto-apply states and effects
 * @property {boolean} baseEndurance - Whether to auto-calculate max endurance from Body
 * @property {boolean} baseHope - Whether to auto-calculate max hope from Heart
 * @property {boolean} baseDefense - Whether to auto-calculate max defense from Wits (+ armor bonus)
 */

/**
 * @typedef {Object} CharacterStats
 * @property {Object} skillChecks - Skill check statistics
 * @property {number} skillChecks.attempts - Number of skill checks attempted
 * @property {number} skillChecks.successes - Number of successful skill checks
 * @property {number} skillChecks.totalSum - Sum of all skill check totals
 * @property {number|null} skillChecks.bestTotal - Highest skill check total
 * @property {number|null} skillChecks.hardestSuccess - Highest difficulty successfully beaten
 * @property {Object.<string, number>} skillChecks.bySkill - Skill usage counts
 * @property {number} skillChecks.solCount - Number of Sol outcomes rolled on d12
 * @property {number} skillChecks.morteCount - Number of Morte outcomes rolled on d12
 * @property {number} skillChecks.successCount - Number of d6 successes rolled
 * @property {Object} contests - Contest result statistics
 * @property {Object} contests.engagement - Engagement win/loss/draw counts
 * @property {Object} contests.contest - Contest win/loss/draw counts
 * @property {number} xpEarned - Total XP earned (incremented when xp increases)
 * @property {number} xpSpent - Total XP spent (incremented when xp decreases)
 * @property {number} treasureEarned - Total treasure earned (incremented when treasure increases)
 * @property {number} treasureSpent - Total treasure spent (incremented when treasure decreases)
 */

/**
 * @typedef {'playerCharacter'|'npc'|'beast'|'beastInstance'} CharacterType
 */

/**
 * @typedef {Object} CharacterBaseFields
 * 
 * // Character Profile
 * @property {string} name - Character name
 * @property {string[]} featuredArtUrls - Character art URLs
 * @property {number} speed - Movement speed
 * @property {string} notes - Character notes
 * 
 * // Core abilities and derived stats
 * @property {number} body - Body attribute
 * @property {number} heart - Heart attribute
 * @property {number} wits - Wits attribute
 * @property {Skill[]} skills - Character skills
 * @property {StatPool} endurance - Endurance pool
 * @property {StatPool} hope - Hope pool
 * @property {StatPool} defense - Defense pool
 * @property {number} load - Current load value
 * @property {number} shadow - Shadow points
 * @property {number} injury - Injury points
 * @property {CharacterStates} states - Character states
 * @property {CharacterConditions} conditions - Character conditions
 * 
 * // Engagement Dice
 * @property {DieSize[]} engagementDice - User-added engagement dice values
 * @property {UUID[]} engagementSuccesses - User-added engagement success IDs
 * @property {Object.<string, string>} engagementDiceStatuses - Saved engagement die statuses keyed by die identifier
 * 
 * // Equipment
 * @property {CharacterEquipment[]} equipment - Equipped items
 * @property {boolean} groupEquipmentBySource - Whether to group equipment by source
 * @property {boolean} [groupEquipmentByCustom] - Whether to group equipment by custom user-defined groups
 * @property {string} equipmentSortOption - Sort option for equipment
 * @property {Array<{id: string, name: string}>} [equipmentCustomGroups] - User-defined equipment group definitions
 * 
 * // MP & Abilities
 * @property {StatPool} mp - Mestiere points
 * @property {CharacterAbility[]} abilities - Character abilities with UI state
 * @property {boolean} groupAbilitiesBySource - Whether to group abilities by source
 * @property {boolean} groupAbilitiesByManaColor - Whether to group abilities by mana color
 * @property {boolean} [groupAbilitiesByCustom] - Whether to group abilities by custom user-defined groups
 * @property {string} abilitySortOption - Sort option for abilities
 * @property {Array<{id: string, name: string}>} [abilityCustomGroups] - User-defined ability group definitions
 * 
 * // Settings & Stats
 * @property {AutoCalculationsSettings} autoCalculations - Auto-calculation settings
 * @property {CharacterStats} rollStats - Aggregate statistics for this character
 * 
 * // Mestiere-specific fields
 * @property {string[]} [biomeTags] - Active biome tags affecting this character
 * @property {string|null} [biomeId] - Selected biome ID
 * @property {number} nimbleStep - Acrobat: Nimble speed-to-action conversion step (0 = full movement, increments by 1 per 10 ft traded)
 * @property {number} [swagger] - Landsknecht swagger pips currently filled
 * @property {number} [swaggerIconIndex] - Landsknecht swagger icon variant index
 * @property {string} [swaggerColor] - Landsknecht swagger icon tint color
 * @property {Object} manaPool - Channeler: each key is a mana color, value is an array of booleans (true = tapped)
 * @property {WitchcraftToken[]} witchcraftTokens - Active witchcraft items (tokens and talismans) (Witch mestiere only)
 * @property {SummonerVessel[]} summonerVessels - Vessels carried by this Summoner character
 * @property {HunterTrap[]} hunterTraps - Trap slots for the Hunter mestiere
 * 
 * // Campaign-related fields
 * @property {string|null} campaignId - If set, this character belongs to a campaign
 * @property {string|null} [ownerId] - Owner user ID
 * @property {boolean} [isPublicPreview] - Whether this character is shown as a preview to unauthenticated visitors
 * @property {string[]} [sectionOrder] - Ordered list of section identifiers for the character sheet layout
 * @property {Object.<string, string[]>} [martialTrainingOverrides] - Manually added martial training grades, keyed by training category
 */

/**
 * @typedef {Object} PlayerCharacterFields
 * @property {string} pronouns - Character pronouns
 * @property {UUID[]} ancestryIds - Selected ancestry concept IDs
 * @property {UUID[]} cultureIds - Selected culture concept IDs
 * @property {UUID|null} mestiereId - Selected mestiere concept ID
 * @property {number} age - Character age, in years
 * @property {number} heightFeet - Character height (feet)
 * @property {number} heightInches - Character height (inches)
 * @property {number} weight - Character weight
 * @property {UUID|null} keeping - Keeping level ID reference
 * @property {number} treasure - Character's current treasure
 * @property {number} xp - Experience points
 */

/**
 * @typedef {Object} BeastFields
 * @property {number} challenge - Challenge rating for beasts (0 = not applicable)
 * @property {string} description - Beast description
 * @property {number} size - Beast size value
 * @property {number} reach - Beast reach, in feet
 */

/**
 * @typedef {BaseEntity & CharacterBaseFields} CharacterBase
 */

/**
 * @typedef {CharacterBase & PlayerCharacterFields & {characterType: 'playerCharacter'}} PlayerCharacter
 */

/**
 * @typedef {CharacterBase & PlayerCharacterFields & {characterType: 'npc'}} NPC
 */

/**
 * @typedef {CharacterBase & BeastFields & {characterType: 'beast'}} Beast
 */

/**
 * @typedef {CharacterBase & BeastFields & {characterType: 'beastInstance', templateId: string}} BeastInstance
 */

/**
 * @typedef {PlayerCharacter | NPC | Beast | BeastInstance} Character
 */

function createDefaultSkills() {
  return Object.values(SKILLS).map((skill) => ({
    key: skill.key,
    ranks: 0,
    isFavored: false,
    isIllFavored: false,
    diceMod: 0,
    manualDiceMod: 0,
  }))
}

function createDefaultCharacterBase() {
  return {
    ...createBaseEntity(),

    characterType: 'playerCharacter',

    // Character Profile
    name: 'New Character',
    featuredArtUrls: ['https://cdn.midjourney.com/a8a36740-b7d3-4aef-bea3-a95039bec06f/0_2.png'],
    speed: 0,
    notes: '',

    // Core abilities and derived stats
    body: 0,
    heart: 0,
    wits: 0,
    skills: createDefaultSkills(),
    endurance: { current: 0, base: 0 },
    hope: { current: 0, base: 0 },
    defense: { current: 0, base: 0 },
    load: 0,
    shadow: 0,
    injury: 0,
    states: {
      weary: false,
      twiceWeary: false,
      miserable: false,
      twiceMiserable: false,
      helpless: false,
      twiceHelpless: false,
    },
    conditions: {
      insecure: false,
      guilty: false,
      angry: false,
      afraid: false,
      troubled: false,
    },

    // Engagement Dice
    engagementDice: [],
    engagementSuccesses: [],
    engagementDiceStatuses: {},

    // Equipment
    equipment: [],
    groupEquipmentBySource: false,
    groupEquipmentByCustom: false,
    equipmentSortOption: 'name-asc',
    equipmentCustomGroups: [],

    // MP & Abilities
    mp: { current: 0, base: 0 },
    abilities: [],
    groupAbilitiesBySource: false,
    groupAbilitiesByManaColor: false,
    groupAbilitiesByCustom: false,
    abilitySortOption: 'name-asc',
    abilityCustomGroups: [],

    // Settings & Stats
    autoCalculations: {
      load: true,
      states: true,
      baseEndurance: true,
      baseHope: true,
      baseDefense: true,
    },
    rollStats: {
      skillChecks: {
        attempts: 0,
        successes: 0,
        totalSum: 0,
        bestTotal: null,
        hardestSuccess: null,
        bySkill: {},
        solCount: 0,
        morteCount: 0,
        successCount: 0,
      },
      contests: {
        engagement: { wins: 0, losses: 0, draws: 0 },
        contest: { wins: 0, losses: 0, draws: 0 },
      },
      xpEarned: 0,
      xpSpent: 0,
      treasureEarned: 0,
      treasureSpent: 0,
    },

    // Mestiere-specific fields
    biomeTags: [],
    biomeId: null,
    nimbleStep: 0,
    swagger: 0,
    swaggerIconIndex: 0,
    swaggerColor: '#ffffff',
    manaPool: { white: [], blue: [], black: [], red: [], green: [], colorless: [] },
    witchcraftTokens: [],
    summonerVessels: [],
    hunterTraps: [],

    // Campaign-related fields
    campaignId: null,
    ownerId: null,
    isPublicPreview: false,

    // Layout and overrides
    sectionOrder: [],
    martialTrainingOverrides: {},
  }
}

function createDefaultPlayerCharacterFields() {
  return {
    pronouns: '',
    ancestryIds: [],
    cultureIds: [],
    mestiereId: null,
    age: 0,
    heightFeet: 0,
    heightInches: 0,
    weight: 0,
    keeping: null,
    treasure: 0,
    xp: 0,
  }
}

function createDefaultBeastFields() {
  return {
    challenge: 0,
    description: '',
    size: 0,
    reach: 0,
  }
}

export function createDefaultPlayerCharacter() {
  return {
    ...createDefaultCharacterBase(),
    ...createDefaultPlayerCharacterFields(),
  }
}

export function createDefaultNPC() {
  return {
    ...createDefaultPlayerCharacter(),
    characterType: 'npc',
  }
}

export function createDefaultBeast() {
  return {
    ...createDefaultCharacterBase(),
    ...createDefaultBeastFields(),
    characterType: 'beast',
  }
}

export function createDefaultBeastInstance(campaignId = null, templateId = null) {
  return {
    ...createDefaultBeast(),
    characterType: 'beastInstance',
    campaignId,
    templateId,
  }
}

export function createDefaultCharacter() {
  return createDefaultPlayerCharacter()
}
