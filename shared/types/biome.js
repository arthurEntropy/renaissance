import { createBaseEntity } from './baseEntity.js'

/**
 * @typedef {import('./baseEntity.js').BaseEntity} BaseEntity
 * @typedef {import('../constants/biomeTags.js').BiomeTag} BiomeTagEnum
 */

/**
 * A valid biome tag value (one of the BiomeTag constant values)
 * @typedef {BiomeTagEnum[keyof BiomeTagEnum]} BiomeTagValue
 */

/**
 * @typedef {Object} BiomeFields
 * @property {string} name - Biome name
 * @property {string} description - Biome description
 * @property {string} artUrl - URL for biome artwork
 * @property {BiomeTagValue[]} tags - Array of BiomeTag values that define this biome
 * @property {number} index - Sort order index
 */

/**
 * @typedef {BaseEntity & BiomeFields} Biome
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
