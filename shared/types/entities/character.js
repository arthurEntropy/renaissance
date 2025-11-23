import { createBaseEntity } from './gameEntity.js'

/**
 * @typedef {Object} Skill
 * @property {string} name - Skill name
 * @property {number} ranks - Number of ranks in this skill
 * @property {boolean} isFavored - Whether this skill is favored
 * @property {boolean} isIllFavored - Whether this skill is ill-favored
 * @property {number} diceMod - Dice modifier from conditions/states/effects
 */

/**
 * @typedef {Object} StatPool
 * @property {number} current - Current value
 * @property {number} max - Maximum value
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
 * @property {boolean} [isWielding] - Whether weapon is currently wielded
 * @property {number} index - Display order index
 * @property {boolean} collapsed - Whether item display is collapsed in UI
 * @property {boolean} artExpanded - Whether art view is expanded in UI
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
 * @typedef {Object} Character
 * @property {string|null} id - UUID identifier
 * @property {string} name - Character name
 * @property {boolean} isBeast - Whether this is a beast/creature
 * @property {string} pronouns - Character pronouns
 * @property {string} ancestries - Ancestry IDs (comma-separated)
 * @property {string} cultures - Culture IDs (comma-separated)
 * @property {string} personalityAndBackground - Character background text
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
 * @property {CharacterEquipmentItem[]} equipment - Equipped items
 * @property {string[]} abilities - Ability IDs
 * @property {string[]} artUrls - Character art URLs
 * @property {ActiveEffect[]} activeEffects - Currently active effects
 * @property {string} createdAt - ISO 8601 datetime string
 * @property {string} lastModified - ISO 8601 datetime string
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
    pronouns: '',
    ancestries: '',
    cultures: '',
    personalityAndBackground: '',
    xp: 0,
    mp: { current: 0, max: 0 },
    body: 0,
    heart: 0,
    wits: 0,
    skills: [
      { name: 'Awe', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0 },
      { name: 'Strength', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0 },
      { name: 'Dexterity', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0 },
      { name: 'Fortitude', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0 },
      { name: 'Craft', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0 },
      { name: 'Perform', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0 },
      { name: 'Insight', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0 },
      { name: 'Courtesy', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0 },
      { name: 'Spirit', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0 },
      { name: 'Aid', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0 },
      { name: 'Persuade', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0 },
      { name: 'Awareness', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0 },
      { name: 'Stealth', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0 },
      { name: 'Lore', ranks: 0, isFavored: false, isIllFavored: false, diceMod: 0 },
      { name: 'Riddle', ranks: 0, isFavored: false, isIllFavored: true, diceMod: 0 },
    ],
    endurance: { current: 0, max: 0 },
    hope: { current: 0, max: 0 },
    defense: { current: 0, max: 0 },
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
    equipment: [],
    abilities: [],
    artUrls: ['https://cdn.midjourney.com/a8a36740-b7d3-4aef-bea3-a95039bec06f/0_2.png'],
    activeEffects: [],
  }
}
