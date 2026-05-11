import { createBaseEntity } from './baseEntity.js'
import { ART_TYPES } from '../constants/artConstants.js'

/**
 * @typedef {import('./baseEntity.js').BaseEntity} BaseEntity
 */

/**
 * @typedef {Object} ArtFields
 * @property {string} url - Image URL
 * @property {string} type - Type of art. Valid values: see ART_TYPES constant in artConstants.js
 * @property {UUID[]} sources - Array of concept IDs this art is associated with
 */

/**
 * @typedef {BaseEntity & ArtFields} Art
 */

/**
 * Creates a new default Art entry
 * @returns {Art}
 */
export function createDefaultArt() {
  return {
    ...createBaseEntity(),
    url: '',
    type: ART_TYPES.DEFAULT,
    sources: [],
  }
}
