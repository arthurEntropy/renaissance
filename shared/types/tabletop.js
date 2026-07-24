import { createBaseEntity } from './baseEntity.js'

/**
 * @typedef {Object} TabletopCanvasItem
 * @property {string} id - Canvas-local UUID for this token instance
 * @property {string} [characterId] - Source character ID (NPC, beast instance, or player character)
 * @property {boolean} isBeast - Whether the token represents a beast
 * @property {string} name - Display name
 * @property {string|null} portraitUrl - Portrait image URL
 * @property {number} size - Token size in grid cells
 * @property {number} x - Canvas x position in pixels
 * @property {number} y - Canvas y position in pixels
 * @property {number} zIndex - Stacking order
 */

/**
 * @typedef {Object} TabletopTransform
 * @property {number} x - Pan x offset in pixels
 * @property {number} y - Pan y offset in pixels
 * @property {number} scale - Zoom scale factor
 */

/**
 * @typedef {Object} TabletopBackgroundImage
 * @property {string} url - Image URL
 * @property {number} naturalWidth - Original image width in pixels
 * @property {number} naturalHeight - Original image height in pixels
 */

/**
 * @typedef {import('./baseEntity.js').BaseEntity} BaseEntity
 */

/**
 * @typedef {Object} RadiusArea
 * @property {string} id - Unique identifier for this area
 * @property {number} originX - Canvas-space x coordinate of the origin
 * @property {number} originY - Canvas-space y coordinate of the origin
 * @property {number} radiusFeet - Radius in feet
 * @property {string} color - CSS hex colour string (e.g. '#ffffff')
 * @property {string} label - User-defined display label for this area
 * @property {string|null} tokenId - Character/token ID this area is anchored to, or null for a free area
 */

/**
 * @typedef {Object} RollLogDieResult
 * @property {number} dieSize - The number of sides on the die (e.g. 6, 12, 20)
 * @property {number} dieRollValue - The value rolled
 * @property {string|null} emoji - Emoji annotation for this die result (🌞/💀/✨) or null
 * @property {boolean} isDropped - Whether this die was dropped from the total
 * @property {boolean} rolledMaxValue - Whether this die rolled its maximum value
 * @property {string} cssClass - DiceFont CSS class string (e.g. 'df-d6-4')
 */

/**
 * @typedef {Object} RollLogEntry
 * @property {string} id - Unique identifier for this entry
 * @property {number} timestamp - Unix timestamp in milliseconds
 * @property {string} characterId - The character who made the roll
 * @property {string} characterName - Display name of the rolling character
 * @property {string|null} portraitUrl - Character portrait URL or null
 * @property {boolean} isNpc - Whether the character is an NPC
 * @property {boolean} isBeast - Whether the character is a beast
 * @property {string} type - Roll type (from RollTypes constant)
 * @property {string|null} skillName - The skill or roll name
 * @property {number|null} total - Overall roll total
 * @property {number|null} diceTotal - Dice-only total (before modifier)
 * @property {number} modifier - Numeric modifier applied to the roll
 * @property {boolean|null} success - Whether the roll succeeded (null if not applicable)
 * @property {number|null} difficulty - Target difficulty (null if not applicable)
 * @property {string|null} footer - Optional footer text
 * @property {string|null} favoredStatus - 'favored' | 'ill-favored' | null
 * @property {number|null} userWins - Engagement wins for user
 * @property {number|null} opponentWins - Engagement wins for opponent
 * @property {number|null} drawCount - Engagement draw count
 * @property {string|null} result - Engagement result type
 * @property {string|null} opponentName - Engagement opponent name
 * @property {string|null} sourceName - Damage source name
 * @property {RollLogDieResult[]} diceResults - Individual die results for display
 */

/**
 * @typedef {Object} TabletopFields
 * @property {string} campaignId - ID of the owning campaign
 * @property {string} name - Tabletop display name
 * @property {TabletopBackgroundImage|null} backgroundImage - Background map image, or null for an unbounded canvas
 * @property {TabletopCanvasItem[]} items - Token instances placed on the canvas
 * @property {TabletopTransform} transform - Current pan/zoom state
 * @property {number} gridSize - Grid cell size in pixels
 * @property {string} gridColor - Grid line colour as a CSS hex string
 * @property {number} gridOpacity - Grid line opacity between 0 and 1
 * @property {boolean} showPaths - Whether to show measurement paths while dragging tokens
 * @property {RadiusArea[]} radiusAreas - Persistent radius measurement areas placed on the canvas
 * @property {RollLogEntry[]} rollLog - Persistent roll history for this tabletop, capped at 100 entries
 * @property {boolean} [rollLogExpanded] - Whether the roll log panel is expanded (per-user, not synced)
 */

/**
 * @typedef {BaseEntity & TabletopFields} Tabletop
 */

/**
 * Creates a new default Tabletop for a campaign.
 * @param {string} campaignId - The owning campaign's ID
 * @param {string} [name] - Optional display name
 * @returns {Tabletop}
 */
export function createDefaultTabletop(campaignId, name = 'New Tabletop') {
  const base = createBaseEntity()
  return {
    ...base,
    campaignId,
    name,
    backgroundImage: null,
    items: [],
    transform: { x: 0, y: 0, scale: 1 },
    gridSize: 40,
    gridColor: '#ffffff',
    gridOpacity: 0.06,
    showPaths: true,
    radiusAreas: [],
    rollLog: [],
  }
}
