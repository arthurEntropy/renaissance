import { createBaseEntity } from './gameEntity.js'

/**
 * @typedef {Object} Biome
 * @property {string|null} id - UUID identifier
 * @property {string} name - Biome name
 * @property {string} description - Biome description
 * @property {string} artUrl - URL for biome artwork
 * @property {string[]} tags - Array of BiomeTag values that define this biome
 * @property {number} index - Sort order index
 * @property {boolean} isDeleted - Soft delete flag
 * @property {string} createdAt - ISO 8601 datetime string
 * @property {string} lastModified - ISO 8601 datetime string
 */

/**
 * Creates a new default Biome
 * @returns {Biome}
 */
export function createDefaultBiome() {
  return {
    ...createBaseEntity(),
    name: 'New Biome',
    description: '',
    artUrl: '',
    tags: [],
    index: 0,
  }
}
