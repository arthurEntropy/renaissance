export const CORE_ABILITY_COLUMNS = {
  body: {
    title: 'BODY',
    coreAbilityKey: 'body',
    virtueLabel: 'Endurance',
    virtueKey: 'endurance',
    weaknessLabel: 'Load',
    weaknessKey: 'load',
    firstStateKey: 'weary',
    secondStateKey: 'twiceWeary',
    skillRange: [0, 5],
  },
  heart: {
    title: 'HEART',
    coreAbilityKey: 'heart',
    virtueLabel: 'Hope',
    virtueKey: 'hope',
    weaknessLabel: 'Shadow',
    weaknessKey: 'shadow',
    firstStateKey: 'miserable',
    secondStateKey: 'twiceMiserable',
    skillRange: [5, 10],
  },
  wits: {
    title: 'WITS',
    coreAbilityKey: 'wits',
    virtueLabel: 'Defense',
    virtueKey: 'defense',
    weaknessLabel: 'Injury',
    weaknessKey: 'injury',
    firstStateKey: 'helpless',
    secondStateKey: 'twiceHelpless',
    skillRange: [10, 15],
  },
}

// Skills affected by conditions and states
export const EFFECT_SKILL_MAPS = {
  conditions: {
    insecure: ['Awe', 'Perform', 'Persuade'],
    guilty: ['Strength', 'Insight', 'Awareness'],
    angry: ['Dexterity', 'Courtesy', 'Stealth'],
    afraid: ['Fortitude', 'Spirit', 'Lore'],
    troubled: ['Craft', 'Aid', 'Riddle'],
  },
  states: {
    weary: ['Awe', 'Strength', 'Dexterity', 'Fortitude', 'Craft'],
    twiceWeary: [''],
    miserable: ['Perform', 'Insight', 'Courtesy', 'Spirit', 'Aid'],
    twiceMiserable: [''],
    helpless: ['Persuade', 'Awareness', 'Stealth', 'Lore', 'Riddle'],
    twiceHelpless: [''],
  },
}

export const MAX_ENDURANCE_MULTIPLIER = 5
export const MAX_HOPE_MULTIPLIER = 3
export const MAX_DEFENSE_BASE = 10

export const DICE_COUNT = 5
export const DICE_SIZES = { D6: 6, D12: 12 }

export const CONDITION_AND_STATE_DICE_MOD = -1
