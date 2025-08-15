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

export const DICE_COUNT = 5
export const DICE_SIZES = { D6: 6, D12: 12 }
