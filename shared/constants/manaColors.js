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

// All keys used for per-mana-color background image overrides
export const MANA_BACKGROUND_KEYS = [...MANA_COLOR_ORDER, ManaColor.MULTICOLOR];
