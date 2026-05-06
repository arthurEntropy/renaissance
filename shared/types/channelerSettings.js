import { createBaseEntity } from './baseEntity.js'

/**
 * A per-mana-color background image setting for Channeler cards.
 *
 * @typedef {Object} ChannelerSettings
 * @property {string|null} id - UUID identifier
 * @property {string} color - Mana color key (e.g. "white", "blue", "multicolor")
 * @property {string} imageUrl - URL of the background image
 * @property {number} index - Sort order
 * @property {boolean} isDeleted - Soft delete flag
 * @property {string} createdAt - ISO 8601 datetime string
 * @property {string} lastModified - ISO 8601 datetime string
 */

/**
 * Creates a default ChannelerSettings record.
 * @returns {ChannelerSettings}
 */
export function createDefaultChannelerSettings() {
  return {
    ...createBaseEntity(),
    color: '',
    imageUrl: '',
    index: 0,
  }
}
