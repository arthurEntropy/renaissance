import { createBaseEntity } from './gameEntity.js'

/**
 * A per-mana-color background image setting for Channeler cards.
 *
 * @typedef {Object} ChannelerSettings
 * @property {string} id - Unique ID (e.g. "channeler-white")
 * @property {string} color - Mana color key (e.g. "white", "blue", "multicolor")
 * @property {string} imageUrl - URL of the background image
 * @property {number} index - Sort order
 * @property {boolean} isDeleted - Soft delete flag
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
