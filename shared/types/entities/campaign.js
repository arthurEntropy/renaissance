import { CAMPAIGN_ROLE, CAMPAIGN_MEMBER_STATUS } from '../../constants/campaignConstants.js'

/**
 * @typedef {Object} CampaignMember
 * @property {string} userId - Firebase UID of the member
 * @property {'gm'|'player'} role - Member role within this campaign
 * @property {'pending'|'accepted'|'declined'} status - Invitation status
 * @property {string[]} characterIds - Character IDs this player has added to the campaign
 * @property {string} joinedAt - ISO 8601, set on acceptance
 * @property {string} invitedAt - ISO 8601
 * @property {string} invitedByUserId - UID of the inviting GM
 */

/**
 * @typedef {Object} ShopGenerationParams
 * @property {Array<{cultureId: string, weight: number}>} cultureMix - Cultures and relative weights
 * @property {Array<{keepingId: string, weight: number}>} keepingMix - Keeping tiers and relative weights
 * @property {number} itemCount - Target total number of items
 */

/**
 * @typedef {Object} ShopItem
 * @property {string} equipmentId - Reference to the equipment item
 * @property {string} name - Snapshot: item name
 * @property {string} description - Snapshot: item description
 * @property {string} keeping - Snapshot: keeping tier name
 * @property {string} source - Snapshot: source ID (culture/ancestry/mestiere)
 */

/**
 * @typedef {Object} CampaignShop
 * @property {string} id - UUID
 * @property {string} name - Display name
 * @property {string} generatedAt - ISO 8601
 * @property {string} primaryCultureId - The culture this shop is nominally associated with
 * @property {ShopGenerationParams} generationParams - Persisted generation parameters
 * @property {boolean} isVisibleToPlayers - Whether players can see this shop in the lobby
 * @property {ShopItem[]} items - Snapshot of generated items
 */

/**
 * @typedef {Object} Campaign
 * @property {string|null} id - UUID identifier
 * @property {string} slug - URL-friendly identifier generated from name at creation
 * @property {string} name - Display name
 * @property {string} description - Optional rich text description
 * @property {string|null} coverImageUrl - Optional cover image URL for the campaign badge
 * @property {string} createdAt - ISO 8601
 * @property {string} lastModified - ISO 8601
 * @property {boolean} isDeleted - Soft delete flag
 * @property {string} foundingGmUserId - UID of the user who created the campaign
 * @property {CampaignMember[]} members - All members including GMs
 * @property {string[]} includedConceptIds - IDs of concepts included in campaign
 * @property {CampaignShop[]} shops - Generated shops
 * @property {string} sessionNotes - GM-only notes for ongoing sessions
 */

/**
 * Creates a new default Campaign
 * @param {string} foundingGmUserId - Firebase UID of the campaign creator
 * @returns {Campaign}
 */
export function createDefaultCampaign(foundingGmUserId) {
  const now = new Date().toISOString()
  return {
    id: null,
    slug: null,
    name: 'New Campaign',
    description: '',
    coverImageUrl: null,
    createdAt: now,
    lastModified: now,
    isDeleted: false,
    foundingGmUserId,
    members: [
      {
        userId: foundingGmUserId,
        role: CAMPAIGN_ROLE.GM,
        status: CAMPAIGN_MEMBER_STATUS.ACCEPTED,
        characterIds: [],
        joinedAt: now,
        invitedAt: now,
        invitedByUserId: foundingGmUserId,
      },
    ],
    includedConceptIds: [],
    shops: [],
    sessionNotes: '',
  }
}
