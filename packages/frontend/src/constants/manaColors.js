// Enum for mana colors
export const ManaColor = {
  WHITE: 'white',
  BLUE: 'blue',
  BLACK: 'black',
  RED: 'red',
  GREEN: 'green',
  COLORLESS: 'colorless', // aka "any"
  MULTICOLOR: 'multicolor', // spells with 2+ distinct colors
}

// Order for display (single colors only)
export const MANA_COLOR_ORDER = [
  ManaColor.WHITE,
  ManaColor.BLUE,
  ManaColor.BLACK,
  ManaColor.RED,
  ManaColor.GREEN,
  ManaColor.COLORLESS,
];

// Canonical single-letter mana symbols used in costs.
export const MANA_SYMBOL_TO_COLOR = /** @type {Readonly<Record<string, string>>} */ (Object.freeze({
  W: ManaColor.WHITE,
  U: ManaColor.BLUE,
  B: ManaColor.BLACK,
  R: ManaColor.RED,
  G: ManaColor.GREEN,
}))

// Reverse lookup for generating shorthand symbols from a color key.
export const MANA_COLOR_TO_SYMBOL = Object.freeze({
  [ManaColor.WHITE]: 'W',
  [ManaColor.BLUE]: 'U',
  [ManaColor.BLACK]: 'B',
  [ManaColor.RED]: 'R',
  [ManaColor.GREEN]: 'G',
})

export const MANA_COLOR_LABELS = Object.freeze({
  [ManaColor.WHITE]: 'White',
  [ManaColor.BLUE]: 'Blue',
  [ManaColor.BLACK]: 'Black',
  [ManaColor.RED]: 'Red',
  [ManaColor.GREEN]: 'Green',
  [ManaColor.COLORLESS]: 'Colorless',
  [ManaColor.MULTICOLOR]: 'Multicolor',
})

export const NO_MANA_COST_GROUP_KEY = 'none'

// Grouped display order: no-cost first, then mono colors, then multicolor, then pure colorless.
export const MANA_COLOR_GROUP_ORDER = [
  NO_MANA_COST_GROUP_KEY,
  ...MANA_COLOR_ORDER.filter((c) => c !== ManaColor.COLORLESS),
  ManaColor.MULTICOLOR,
  ManaColor.COLORLESS,
]

export const MANA_COLOR_GROUP_LABELS = /** @type {Readonly<Record<string, string>>} */ (Object.freeze({
  ...MANA_COLOR_LABELS,
  [NO_MANA_COST_GROUP_KEY]: 'No Mana Cost',
}))

// TODO: Set up as environment variables and fetch from backend when we deploy.
// Card backgrounds keyed by computed mana color bucket.
export const MANA_BACKGROUND_IMAGES = /** @type {Readonly<Record<string, string>>} */ (Object.freeze({
  [ManaColor.WHITE]: 'https://cdn.midjourney.com/07481332-c0d4-4486-986a-cb2e3af39493/0_2.png',
  [ManaColor.BLUE]: 'https://cdn.midjourney.com/7ca5c69c-dde3-4679-9748-364731197e2c/0_0.png',
  [ManaColor.BLACK]: 'https://cdn.midjourney.com/4237a317-3992-4143-8f42-e14f1e6f31a3/0_1.png',
  [ManaColor.RED]: 'https://cdn.midjourney.com/c729224d-bdb9-4b98-917b-532559f0ff8d/0_2.png',
  [ManaColor.GREEN]: 'https://cdn.midjourney.com/ef9d4393-a021-41bb-a0ae-2707e2f27311/0_3.png',
  [ManaColor.COLORLESS]: 'https://cdn.midjourney.com/78dc5c7f-dd89-428d-b554-c789c0779d5e/0_3.png',
  [ManaColor.MULTICOLOR]: 'https://cdn.midjourney.com/9ca88cee-e4fb-4489-88e4-024c0cf59caf/0_2.png',
}))

// All keys used for per-mana-color background image overrides.
export const MANA_BACKGROUND_KEYS = Object.keys(MANA_BACKGROUND_IMAGES)