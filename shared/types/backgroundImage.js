import { createBaseEntity } from './baseEntity.js'

/**
 * @typedef {Object} BackgroundImage
 * @property {string|null} id - UUID identifier
 * @property {string} imageUrl - Background image URL
 * @property {boolean} isDeleted - Soft delete flag
 * @property {string} createdAt - ISO 8601 datetime string
 * @property {string} lastModified - ISO 8601 datetime string
 */

/**
 * Creates a new default BackgroundImage
 * @returns {BackgroundImage}
 */
export function createDefaultBackgroundImage() {
  return {
    ...createBaseEntity(),
    imageUrl: '',
  }
}
