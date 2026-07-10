import { createBaseEntity } from './baseEntity.js'
import { CAMPAIGN_ROLE, CAMPAIGN_MEMBER_STATUS } from '../constants/campaignConstants.js'

/**
 * @typedef {import('../constants/campaignConstants.js').CAMPAIGN_ROLE} CampaignRoleEnum
 * @typedef {import('../constants/campaignConstants.js').CAMPAIGN_MEMBER_STATUS} CampaignMemberStatusEnum
 * @typedef {CampaignRoleEnum[keyof CampaignRoleEnum]} CampaignRole
 * @typedef {CampaignMemberStatusEnum[keyof CampaignMemberStatusEnum]} CampaignMemberStatus
 */

/**
 * @typedef {Object} CampaignMember
 * @property {UUID} userId - Firebase UID of the member
 * @property {CampaignRole} role - Member role within this campaign
 * @property {CampaignMemberStatus} status - Invitation status
 * @property {UUID[]} characterIds - Character IDs this player has added to the campaign
 */

/**
 * @typedef {Object} ShopGenerationParams
 * @property {Array<{cultureId: UUID, weight: number}>} cultureMix - Cultures and relative weights
 * @property {Array<{keepingId: UUID, weight: number}>} keepingMix - Keeping tiers and relative weights
 * @property {number} itemCount - Target total number of items
 */

/**
 * @typedef {Object} CampaignShop
 * @property {UUID} id - Shop ID
 * @property {string} name - Shop name
 * @property {UUID} primaryCultureId - TODO: There is currently no way to set this in the UI. This might be more appropriate on ShopGenerationParams.
 * @property {ShopGenerationParams} generationParams - Persisted generation parameters
 * @property {boolean} isVisibleToPlayers - Whether players can see this shop in the lobby
 * @property {UUID[]} items - Equipment item IDs in this shop
 */

/**
 * @typedef {Object} CampaignLobbyState
 * @property {UUID[]} inactiveNpcIds - NPC IDs marked as inactive in the lobby
 * @property {UUID[]} hiddenNpcIds - NPC IDs hidden from players (GM-only)
 * @property {UUID[]} inactivePlayerCharacterIds - Player character IDs marked as inactive
 */

/**
 * @typedef {'npc'|'beast'} CombatantType
 */

/**
 * @typedef {Object} CombatCombatant
 * @property {string} id - Stable local combatant entry ID, formatted as type:characterId
 * @property {CombatantType} type - Combatant type
 * @property {UUID} characterId - Character ID (NPC or beast instance)
 */

/**
 * @typedef {Object} CombatGroup
 * @property {UUID} id - Combat group ID
 * @property {string} name - Combat group name
 * @property {CombatCombatant[]} combatants - Ordered combatants in this group
 */

/**
 * @typedef {import('./baseEntity.js').BaseEntity} BaseEntity
 */

/**
 * @typedef {Object} CampaignFields
 * @property {string|null} slug - URL-friendly identifier generated from name at creation. TODO: This should get updated when the name changes.
 * @property {string} name - Campaign name
 * @property {string} description - Campaign description
 * @property {string|null} coverImageUrl - Cover image URL for the campaign badge and lobby background
 * @property {string} foundingGmUserId - Firebase UID of the user who created the campaign
 * @property {CampaignMember[]} members - All campaign members
 * @property {UUID[]} includedConceptIds - IDs of concepts included in campaign
 * @property {CampaignShop[]} shops - Generated shops
 * @property {CampaignLobbyState} lobbyState - Shared GM lobby arrangement
 * @property {CombatGroup[]} combatGroups - Shared combat groups for campaign lobby
 * @property {string[]} tabletopIds - IDs of tabletops belonging to this campaign, in display order
 * @property {string|null} activeTabletopId - ID of the currently active tabletop visible to all members, or null
 */

/**
 * @typedef {BaseEntity & CampaignFields} Campaign
 */

/**
 * Creates a new default Campaign
 * @param {string} foundingGmUserId - Firebase UID of the campaign creator
 * @returns {Campaign}
 */
export function createDefaultCampaign(foundingGmUserId) {
  const base = createBaseEntity()
  return {
    ...base,
    slug: null,
    name: 'New Campaign',
    description: '',
    coverImageUrl: null,
    foundingGmUserId,
    members: [
      {
        userId: foundingGmUserId,
        role: CAMPAIGN_ROLE.GM,
        status: CAMPAIGN_MEMBER_STATUS.ACCEPTED,
        characterIds: [],
      },
    ],
    includedConceptIds: [],
    shops: [],
    lobbyState: {
      inactiveNpcIds: [],
      hiddenNpcIds: [],
      inactivePlayerCharacterIds: [],
    },
    combatGroups: [],
    tabletopIds: [],
    activeTabletopId: null,
  }
}
