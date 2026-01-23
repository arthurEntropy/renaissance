import { createBaseEntity } from './gameEntity.js'

/**
 * @typedef {Object} UserPreferences
 * @property {string} theme - UI theme preference
 * @property {boolean} notifications - Notification preference
 * @property {boolean} showArtwork - Whether to show artwork on cards
 */

/**
 * @typedef {Object} User
 * @property {string|null} id - UUID identifier
 * @property {string} email - User email
 * @property {string} name - Display name
 * @property {'user'|'admin'} role - User role
 * @property {'pending'|'approved'} status - Account status
 * @property {boolean} isDeleted - Soft delete flag
 * @property {UserPreferences} preferences - User preferences
 * @property {string[]} characters - Character IDs owned by this user
 * @property {string} createdAt - ISO 8601 datetime string
 * @property {string} lastModified - ISO 8601 datetime string
 */

/**
 * Creates a new default User
 * @returns {User}
 */
export function createDefaultUser() {
  return {
    ...createBaseEntity(),
    email: '',
    name: '',
    role: 'user',
    status: 'pending',
    preferences: {
      theme: 'dark',
      notifications: true,
      showArtwork: true,
    },
    characters: [],
  }
}
