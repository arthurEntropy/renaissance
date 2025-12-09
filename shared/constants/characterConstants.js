export const MAX_ENDURANCE_MULTIPLIER = 5
export const MAX_HOPE_MULTIPLIER = 3
export const MAX_DEFENSE_BASE = 10
export const MAX_SKILL_RANKS = 5

export const CORE_ABILITIES = {
  BODY: 'body',
  HEART: 'heart',
  WITS: 'wits'
}

export const VIRTUES = {
  ENDURANCE: { key: 'endurance', coreAbility: 'body', label: 'Endurance' },
  HOPE: { key: 'hope', coreAbility: 'heart', label: 'Hope' },
  DEFENSE: { key: 'defense', coreAbility: 'wits', label: 'Defense' }
}

export const WEAKNESSES = {
  LOAD: { key: 'load', coreAbility: 'body', label: 'Load' },
  SHADOW: { key: 'shadow', coreAbility: 'heart', label: 'Shadow' },
  INJURY: { key: 'injury', coreAbility: 'wits', label: 'Injury' }
}

export const CONDITIONS = {
  INSECURE: { key: 'insecure', label: 'Insecure' },
  GUILTY: { key: 'guilty', label: 'Guilty' },
  ANGRY: { key: 'angry', label: 'Angry' },
  AFRAID: { key: 'afraid', label: 'Afraid' },
  TROUBLED: { key: 'troubled', label: 'Troubled' }
}

export const STATES = {
  WEARY: { key: 'weary', coreAbility: 'body', label: 'Weary' },
  TWICE_WEARY: { key: 'twiceWeary', coreAbility: 'body', label: 'Twice Weary' },
  MISERABLE: { key: 'miserable', coreAbility: 'heart', label: 'Miserable' },
  TWICE_MISERABLE: { key: 'twiceMiserable', coreAbility: 'heart', label: 'Twice Miserable' },
  HELPLESS: { key: 'helpless', coreAbility: 'wits', label: 'Helpless' },
  TWICE_HELPLESS: { key: 'twiceHelpless', coreAbility: 'wits', label: 'Twice Helpless' }
}

export const CONDITION_AFFECTED_SKILLS = {
  insecure: ['Awe', 'Perform', 'Persuade'],
  guilty: ['Strength', 'Insight', 'Awareness'],
  angry: ['Dexterity', 'Courtesy', 'Stealth'],
  afraid: ['Fortitude', 'Spirit', 'Lore'],
  troubled: ['Craft', 'Aid', 'Riddle'],
}

export const STATE_AFFECTED_SKILLS = {
  weary: ['Awe', 'Strength', 'Dexterity', 'Fortitude', 'Craft'],
  miserable: ['Perform', 'Insight', 'Courtesy', 'Spirit', 'Aid'],
  helpless: ['Persuade', 'Awareness', 'Stealth', 'Lore', 'Riddle'],
}

export const CONDITION_AND_STATE_DICE_MODIFIER = -1
