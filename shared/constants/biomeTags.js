// Environment tags used by Biomes to augment or inhibit ability rolls

// Placeholder art shown when no biome preset is selected
export const CUSTOM_BIOME_ART_URL = 'https://cdn.midjourney.com/8c252045-8599-4514-bf8d-392600a91730/0_3.png'

export const BiomeTagEffect = {
  AUGMENT: 'augment',
  INHIBIT: 'inhibit',
}

// Mestieri that interact with biomes
export const BIOME_MESTIERI = ['hunter', 'tinker', 'wildheart']

export const BiomeTag = {
  // Terrain group
  FOREST: 'forest',
  PLAINS: 'plains',
  MOUNTAIN: 'mountain',
  DESERT: 'desert',
  WETLAND: 'wetland',
  WATER: 'water',
  UNDERGROUND: 'underground',
  // Climate group
  COLD: 'cold',
  TEMPERATE: 'temperate',
  HOT: 'hot',
  // Influence group
  CIVILIZED: 'civilized',
  RUINED: 'ruined',
  CORRUPTED: 'corrupted',
  ENCHANTED: 'enchanted',
}

/** @typedef {typeof BiomeTag[keyof typeof BiomeTag]} BiomeTagValue */

export const BiomeTagGroup = {
  TERRAIN: 'terrain',
  CLIMATE: 'climate',
  INFLUENCE: 'influence',
}

export const BIOME_TAG_GROUPS = {
  [BiomeTagGroup.TERRAIN]: [
    BiomeTag.FOREST,
    BiomeTag.PLAINS,
    BiomeTag.MOUNTAIN,
    BiomeTag.DESERT,
    BiomeTag.WETLAND,
    BiomeTag.WATER,
    BiomeTag.UNDERGROUND,
  ],
  [BiomeTagGroup.CLIMATE]: [
    BiomeTag.COLD,
    BiomeTag.TEMPERATE,
    BiomeTag.HOT,
  ],
  [BiomeTagGroup.INFLUENCE]: [
    BiomeTag.CIVILIZED,
    BiomeTag.RUINED,
    BiomeTag.CORRUPTED,
    BiomeTag.ENCHANTED,
  ],
}

export const BIOME_TAG_LABELS = {
  [BiomeTag.FOREST]: 'Forest',
  [BiomeTag.PLAINS]: 'Plains',
  [BiomeTag.MOUNTAIN]: 'Mountain',
  [BiomeTag.DESERT]: 'Desert',
  [BiomeTag.WETLAND]: 'Wetland',
  [BiomeTag.WATER]: 'Water',
  [BiomeTag.UNDERGROUND]: 'Underground',
  [BiomeTag.COLD]: 'Cold',
  [BiomeTag.TEMPERATE]: 'Temperate',
  [BiomeTag.HOT]: 'Hot',
  [BiomeTag.CIVILIZED]: 'Civilized',
  [BiomeTag.RUINED]: 'Ruined',
  [BiomeTag.CORRUPTED]: 'Corrupted',
  [BiomeTag.ENCHANTED]: 'Enchanted',
}

export const BIOME_TAG_GROUP_LABELS = {
  [BiomeTagGroup.TERRAIN]: 'Terrain',
  [BiomeTagGroup.CLIMATE]: 'Climate',
  [BiomeTagGroup.INFLUENCE]: 'Influence',
}

// Which group each tag belongs to (for styling)
export const BIOME_TAG_GROUP_MAP = Object.fromEntries(
  Object.entries(BIOME_TAG_GROUPS).flatMap(([group, tags]) =>
    tags.map((tag) => [tag, group])
  )
)

// Flat ordered list for display: terrain → climate → influence
export const BIOME_TAG_DISPLAY_ORDER = [
  ...BIOME_TAG_GROUPS[BiomeTagGroup.TERRAIN],
  ...BIOME_TAG_GROUPS[BiomeTagGroup.CLIMATE],
  ...BIOME_TAG_GROUPS[BiomeTagGroup.INFLUENCE],
]
