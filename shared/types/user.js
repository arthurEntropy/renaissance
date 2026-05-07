import { createBaseEntity } from './baseEntity.js'

/**
 * @typedef {import('./baseEntity.js').BaseEntity} BaseEntity
 */

/**
 * @typedef {Object} UserPreferences
 * @property {string} theme - UI theme preference
 * @property {boolean} notifications - Notification preference
 * @property {boolean} showArtwork - Whether to show artwork on cards
 */

/**
 * @typedef {Object} UserFields
 * @property {string} name - Display name
 * @property {'user'|'admin'} role - User role
 * @property {'pending'|'approved'} status - Account status
 * @property {UserPreferences} preferences - User preferences
 * @property {string[]} characters - Character IDs owned by this user
 * @property {string|null} activeCampaignId - ID of the campaign the user is currently viewing in campaign mode
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
    role: 'user',
    status: 'pending',
    preferences: {
      theme: 'dark',
      notifications: true,
      showArtwork: true,
    },
    characters: [],
    activeCampaignId: null,
  }
}
