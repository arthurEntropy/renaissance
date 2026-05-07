import { createBaseEntity } from './baseEntity.js'
import { USER_ROLE, USER_STATUS } from '../constants/userConstants.js'

/**
 * @typedef {import('./baseEntity.js').BaseEntity} BaseEntity
 * @typedef {import('../constants/userConstants.js').USER_ROLE} UserRoleEnum
 * @typedef {import('../constants/userConstants.js').USER_STATUS} UserStatusEnum
 * @typedef {UserRoleEnum[keyof UserRoleEnum]} UserRole
 * @typedef {UserStatusEnum[keyof UserStatusEnum]} UserStatus
 */

/**
 * @typedef {Object} UserPreferences
 * @property {boolean} showCardArtwork - Whether to show artwork on cards
 * @property {string|null} backgroundImageId - Selected app background image ID
 */

/**
 * @typedef {Object} UserFields
 * @property {string} name - Display name
 * @property {UserRole} role - User role
 * @property {UserStatus} status - Account status
 * @property {UserPreferences} preferences - User preferences
 * @property {UUID[]} characters - Character IDs owned by this user
 * @property {UUID|null} activeCampaignId - ID of the campaign the user is currently viewing in campaign mode
 */

/**
 * @typedef {BaseEntity & UserFields} User
 */

/**
 * Creates a new default User
 * @returns {User}
 */
export function createDefaultUser() {
  return {
    ...createBaseEntity(),
    name: '',
    role: USER_ROLE.USER,
    status: USER_STATUS.PENDING,
    preferences: {
      showCardArtwork: true,
      backgroundImageId: null,
    },
    characters: [],
    activeCampaignId: null,
  }
}
