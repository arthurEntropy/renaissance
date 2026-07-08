import { createBaseEntity } from './baseEntity.js'

/**
 * @typedef {Object} ArtPlaceholderFields
 * @property {string} url - The image URL to use as a placeholder
 * @property {number} index - Display order index
 */

/**
 * @typedef {import('./baseEntity.js').BaseEntity & ArtPlaceholderFields} ArtPlaceholder
 */

/**
 * Creates a new default ArtPlaceholder
 * @returns {ArtPlaceholder}
 */
export function createDefaultArtPlaceholder() {
  return {
    ...createBaseEntity(),
    url: '',
    index: 0,
  }
}
