import { createBaseEntity } from './baseEntity.js'

/**
 * @typedef {import('./baseEntity.js').BaseEntity} BaseEntity
 */

/**
 * @typedef {Object} Skill
 * @property {string} name - Skill name
 * @property {string} coreAbility - Core ability this skill is associated with ('body', 'heart', or 'wits')
 * @property {number} ranks - Number of ranks in this skill
 * @property {boolean} isFavored - Whether this skill is favored
 * @property {boolean} isIllFavored - Whether this skill is ill-favored
 * @property {number} diceMod - Dice modifier from conditions/states/effects (auto-calculated)
 * @property {number} manualDiceMod - Manual dice modifier set by user
 */

/**
 * @typedef {Object} StatPool
 * @property {number} current - Current value
 * @property {number} max - Maximum value
 * @property {string} [coreAbility] - Core ability this stat is associated with ('body', 'heart', or 'wits')
 */

/**
 * @typedef {Object} CharacterStates
 * @property {boolean} weary - Character is weary
 * @property {boolean} twiceWeary - Character is twice weary
 * @property {boolean} miserable - Character is miserable
 * @property {boolean} twiceMiserable - Character is twice miserable
 * @property {boolean} helpless - Character is helpless
 * @property {boolean} twiceHelpless - Character is twice helpless
 */

/**
 * @typedef {Object} CharacterConditions
 * @property {boolean} insecure - Character is insecure
 * @property {boolean} guilty - Character is guilty
 * @property {boolean} angry - Character is angry
 * @property {boolean} afraid - Character is afraid
 * @property {boolean} troubled - Character is troubled
 */

/**
 * @typedef {Object} CharacterEquipmentItem
 * @property {string} id - Equipment ID reference
 * @property {number} quantity - Number of items
 * @property {boolean} isCarried - Whether item is currently carried
 * @property {boolean} [isWielding] - Whether item is currently wielded
 * @property {number} index - Display order index
 * @property {boolean} collapsed - Whether item display is collapsed in UI
 * @property {boolean} artExpanded - Whether art view is expanded in UI
 * @property {number} [columnIndex] - Column index (0-2) in the three-column layout
 * @property {string|null} [customGroupId] - ID of the custom group this item belongs to
 * @property {number|null} [difficulty] - Set difficulty for Hunter's Trap items
 * @property {string|null} [pendingDiscoveryAbilityId] - Ability pre-selected for Mesmer's Mask discovery, persisted until claimed
 */

/**
 * @typedef {Object} WitchcraftToken
 * @property {string} id - Local UUID
 * @property {string|null} abilityId - ID of the stored spell ability
 * @property {string} imageUrl - Icon path or custom image URL
 * @property {string} givenTo - Who currently holds this token
 * @property {string} notes - Optional notes (e.g. contingency triggers)
 */

/**
 * @typedef {Object} WitchcraftTalisman
 * @property {string} id - Local UUID
 * @property {string|null} abilityId - ID of the stored spell ability
 * @property {string} imageUrl - Icon path or custom image URL
 * @property {string} givenTo - Who currently holds this talisman
 * @property {string} notes - Optional notes (e.g. contingency triggers)
 */

/**
 * @typedef {Object} SummonerVessel
 * @property {string} id - Local UUID
 * @property {string|null} beastId - ID of the captured beast character (null if vessel is empty)
 * @property {number} friendship - 0–10 friendship score with the captured beast
 * @property {boolean} isActive - Whether this vessel is primed for the current rest
 * @property {boolean} isSummoned - Whether the creature is currently out of its vessel
 * @property {'standard'|'great'|'ultra'|'maestro'} vesselType - Quality tier of the vessel
 * @property {string} vesselNote - Optional player description of the physical vessel object
 * @property {string} imageUrl - Icon path for the vessel
 */

/**
 * @typedef {Object} CharacterAbilityItem
 * @property {string} id - Ability ID reference
 * @property {boolean} collapsed - Whether ability display is collapsed in UI
 * @property {boolean} showImprovements - Whether improvements section is expanded in UI
 * @property {boolean} showSuccesses - Whether successes section is expanded in UI
 * @property {Object.<string, boolean>} [improvements] - Map of improvement IDs to ownership status
 * @property {number} [columnIndex] - Column index (0-2) in the three-column layout
 * @property {string|null} [customGroupId] - ID of the custom group this ability belongs to
 * @property {number|null} [difficulty] - Set difficulty for abilities that require one
 */

/**

 * @typedef {Object} ActiveEffect
 * @property {string} name - Effect name
 * @property {Object[]} skillsModified - Skills affected by this effect
 * @property {string} skillsModified[].name - Skill name
 * @property {number} skillsModified[].diceMod - Dice modifier
 * @property {boolean} [skillsModified[].makeFavored] - Make skill favored
 * @property {boolean} [skillsModified[].makeIllFavored] - Make skill ill-favored
 */

/**
 * @typedef {Object} CharacterFields
 * @property {string} name - Character name
 * @property {boolean} isBeast - Whether this is a beast/creature
 * @property {number} challenge - Challenge rating for beasts (0 = not applicable)
 * @property {string} description - Beast description
 * @property {number} size - Beast size value
 * @property {number} reach - Beast reach in feet
 * @property {string} pronouns - Character pronouns
 * @property {string} ancestries - Ancestry IDs (comma-separated)
 * @property {string} cultures - Culture IDs (comma-separated)
 * @property {string} notes - Character notes and background text
 * @property {string|null} keeping - Keeping level ID reference
 * @property {number} treasure - Character treasure
 * @property {number} age - Character age
 * @property {number} heightFeet - Character height (feet)
 * @property {number} heightInches - Character height (inches)
 * @property {number} weight - Character weight
 * @property {number} xp - Experience points
 * @property {StatPool} mp - Mestiere points
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
 * @property {number} speed - Movement speed
 * @property {number} nimbleStep - Nimble speed-to-action conversion step (0 = full movement, increments by 1 per 10 ft traded)
 * @property {Object} manaPool - Channeler mana pool; each key is a mana color, value is an array of booleans (true = tapped)
 * @property {CharacterEquipmentItem[]} equipment - Equipped items
 * @property {CharacterAbilityItem[]} abilities - Character abilities with UI state
 * @property {string|null} campaignId - If set, this character belongs to a campaign (NPC or beast instance)
 * @property {boolean} isNPC - True for GM-controlled humanoid characters within a campaign
 * @property {null|'template'|'instance'} beastType - Beast classification; null = not a beast, 'template' = bestiary entry, 'instance' = campaign creature
 * @property {string|null} templateId - For beastType='instance', references the source template character
 * @property {string[]} artUrls - Character art URLs
 * @property {string[]} [biomeTags] - Active biome tags affecting this character
 * @property {string|null} [biomeId] - Selected biome ID
 * @property {Object.<string, string>} engagementDiceStatuses - Saved engagement die statuses keyed by die identifier
 * @property {ActiveEffect[]} activeEffects - Currently active effects
 * @property {boolean} groupAbilitiesBySource - Whether to group abilities by source
 * @property {boolean} groupAbilitiesByManaColor - Whether to group abilities by mana color
 * @property {boolean} [groupAbilitiesByCustom] - Whether to group abilities by custom user-defined groups
 * @property {boolean} groupEquipmentBySource - Whether to group equipment by source
 * @property {boolean} [groupEquipmentByCustom] - Whether to group equipment by custom user-defined groups
 * @property {Array<{id: string, name: string}>} [abilityCustomGroups] - User-defined ability group definitions
 * @property {Array<{id: string, name: string}>} [equipmentCustomGroups] - User-defined equipment group definitions
 * @property {string} abilitySortOption - Sort option for abilities
 * @property {string} equipmentSortOption - Sort option for equipment
 * @property {Object} autoCalculations - Auto-calculation settings
 * @property {boolean} autoCalculations.load - Whether to auto-calculate load
 * @property {boolean} autoCalculations.statesAndEffects - Whether to auto-apply states and effects
 * @property {boolean} autoCalculations.maxEndurance - Whether to auto-calculate max endurance from Body
 * @property {boolean} autoCalculations.maxHope - Whether to auto-calculate max hope from Heart
 * @property {boolean} autoCalculations.maxDefense - Whether to auto-calculate max defense from Wits (+ armor bonus)
 * @property {Object} rollStats - Aggregate roll statistics for this character
 * @property {Object} rollStats.skillChecks - Skill check statistics
 * @property {number} rollStats.skillChecks.attempts - Number of skill checks attempted
 * @property {number} rollStats.skillChecks.successes - Number of successful skill checks
 * @property {number} rollStats.skillChecks.totalSum - Sum of all skill check totals
 * @property {number|null} rollStats.skillChecks.bestTotal - Highest skill check total
 * @property {number|null} rollStats.skillChecks.hardestSuccess - Highest difficulty successfully beaten
 * @property {Object.<string, number>} rollStats.skillChecks.bySkill - Skill usage counts
 * @property {number} rollStats.skillChecks.solCount - Number of Sol outcomes rolled on d12
 * @property {number} rollStats.skillChecks.morteCount - Number of Morte outcomes rolled on d12
 * @property {number} rollStats.skillChecks.successCount - Number of d6 successes rolled
 * @property {Object} rollStats.contests - Contest result statistics
 * @property {Object} rollStats.contests.engagement - Engagement win/loss/draw counts
 * @property {Object} rollStats.contests.opposed - Opposed skill check win/loss/draw counts
 * @property {WitchcraftToken[]} witchcraftTokens - Active witchcraft tokens (Witch mestiere only)
 * @property {WitchcraftTalisman[]} witchcraftTalismans - Active witchcraft talismans (Witch mestiere only)
 * @property {SummonerVessel[]} summonerVessels - Vessels carried by this Summoner character
 */

/**
 * @typedef {BaseEntity & CharacterFields} Character
 */

/**
 * Creates a new default Character
 * @returns {Character}
 */
export function createDefaultCharacter() {
  return {
    ...createBaseEntity(),
    name: 'New Character',
    isBeast: false,
    campaignId: null,
    isNPC: false,
    beastType: null,
    templateId: null,
    challenge: 0,
    description: '',
    size: 0,
    reach: 0,
    pronouns: '',
    ancestries: '',
    cultures: '',
    notes: '',
    keeping: null,
    treasure: 0,
    age: 0,
    heightFeet: 0,
    heightInches: 0,
    weight: 0,
    xp: 0,
    mp: { current: 0, max: 0 },
    body: 0,
    heart: 0,
    wits: 0,
    skills: [
      { name: 'Awe', coreAbility: 'body', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0, manualDiceMod: 0 },
      { name: 'Strength', coreAbility: 'body', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0, manualDiceMod: 0 },
      { name: 'Dexterity', coreAbility: 'body', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0, manualDiceMod: 0 },
      { name: 'Fortitude', coreAbility: 'body', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0, manualDiceMod: 0 },
      { name: 'Craft', coreAbility: 'body', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0, manualDiceMod: 0 },
      { name: 'Perform', coreAbility: 'heart', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0, manualDiceMod: 0 },
      { name: 'Insight', coreAbility: 'heart', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0, manualDiceMod: 0 },
      { name: 'Courtesy', coreAbility: 'heart', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0, manualDiceMod: 0 },
      { name: 'Spirit', coreAbility: 'heart', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0, manualDiceMod: 0 },
      { name: 'Aid', coreAbility: 'heart', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0, manualDiceMod: 0 },
      { name: 'Persuade', coreAbility: 'wits', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0, manualDiceMod: 0 },
      { name: 'Awareness', coreAbility: 'wits', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0, manualDiceMod: 0 },
      { name: 'Stealth', coreAbility: 'wits', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0, manualDiceMod: 0 },
      { name: 'Lore', coreAbility: 'wits', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0, manualDiceMod: 0 },
      { name: 'Riddle', coreAbility: 'wits', ranks: 0, isFavored: false, isIllFavored: true, diceMod: 0, manualDiceMod: 0 },
    ],
    endurance: { current: 0, max: 0, coreAbility: 'body' },
    hope: { current: 0, max: 0, coreAbility: 'heart' },
    defense: { current: 0, max: 0, coreAbility: 'wits' },
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
    speed: 0,
    nimbleStep: 0,
    manaPool: { white: [], blue: [], black: [], red: [], green: [], colorless: [] },
    equipment: [],
    abilities: [],
    artUrls: ['https://cdn.midjourney.com/a8a36740-b7d3-4aef-bea3-a95039bec06f/0_2.png'],
    engagementDiceStatuses: {},
    biomeTags: [],
    biomeId: null,
    activeEffects: [],
    witchcraftTokens: [],
    witchcraftTalismans: [],
    summonerVessels: [],
    groupAbilitiesBySource: false,
    groupAbilitiesByManaColor: false,
    groupEquipmentBySource: false,
    abilitySortOption: 'name-asc',
    equipmentSortOption: 'name-asc',
    autoCalculations: {
      load: true,
      statesAndEffects: true,
      maxEndurance: true,
      maxHope: true,
      maxDefense: true,
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
        opposed: { wins: 0, losses: 0, draws: 0 },
      },
    },
  }
}
