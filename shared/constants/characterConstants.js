export const BASE_ENDURANCE_MULTIPLIER = 5
export const BASE_HOPE_MULTIPLIER = 2
export const BASE_DEFENSE_MINIMUM = 0
export const MAX_SKILL_RANKS = 5
export const CONDITION_AND_STATE_DICE_MODIFIER = -1

export const CORE_ABILITIES = {
  BODY: { key: 'body', label: 'BODY' },
  HEART: { key: 'heart', label: 'HEART' },
  WITS: { key: 'wits', label: 'WITS' }
}

export const SKILLS = {
  // BODY
  AWE: { key: 'awe', label: 'Awe', coreAbility: CORE_ABILITIES.BODY },
  STRENGTH: { key: 'strength', label: 'Strength', coreAbility: CORE_ABILITIES.BODY },
  DEXTERITY: { key: 'dexterity', label: 'Dexterity', coreAbility: CORE_ABILITIES.BODY },
  FORTITUDE: { key: 'fortitude', label: 'Fortitude', coreAbility: CORE_ABILITIES.BODY },
  CRAFT: { key: 'craft', label: 'Craft', coreAbility: CORE_ABILITIES.BODY },
  
  // HEART
  PERFORM: { key: 'perform', label: 'Perform', coreAbility: CORE_ABILITIES.HEART },
  INSIGHT: { key: 'insight', label: 'Insight', coreAbility: CORE_ABILITIES.HEART },
  COURTESY: { key: 'courtesy', label: 'Courtesy', coreAbility: CORE_ABILITIES.HEART },
  SPIRIT: { key: 'spirit', label: 'Spirit', coreAbility: CORE_ABILITIES.HEART },
  AID: { key: 'aid', label: 'Aid', coreAbility: CORE_ABILITIES.HEART },
  
  // WITS
  PERSUADE: { key: 'persuade', label: 'Persuade', coreAbility: CORE_ABILITIES.WITS },
  AWARENESS: { key: 'awareness', label: 'Awareness', coreAbility: CORE_ABILITIES.WITS },
  STEALTH: { key: 'stealth', label: 'Stealth', coreAbility: CORE_ABILITIES.WITS },
  LORE: { key: 'lore', label: 'Lore', coreAbility: CORE_ABILITIES.WITS },
  RIDDLE: { key: 'riddle', label: 'Riddle', coreAbility: CORE_ABILITIES.WITS, defaultIllFavored: true }
}

export const VIRTUES = {
  ENDURANCE: { key: 'endurance', label: 'Endurance', coreAbility: CORE_ABILITIES.BODY },
  HOPE: { key: 'hope', label: 'Hope', coreAbility: CORE_ABILITIES.HEART },
  DEFENSE: { key: 'defense', label: 'Defense', coreAbility: CORE_ABILITIES.WITS }
}

export const WEAKNESSES = {
  LOAD: { key: 'load', label: 'Load', coreAbility: CORE_ABILITIES.BODY },
  SHADOW: { key: 'shadow', label: 'Shadow', coreAbility: CORE_ABILITIES.HEART },
  INJURY: { key: 'injury', label: 'Injury', coreAbility: CORE_ABILITIES.WITS }
}

export const CONDITIONS = {
  INSECURE: {
    key: 'insecure',
    label: 'Insecure',
    affectedSkills: [SKILLS.AWE, SKILLS.PERFORM, SKILLS.PERSUADE],
  },
  GUILTY: {
    key: 'guilty',
    label: 'Guilty',
    affectedSkills: [SKILLS.STRENGTH, SKILLS.INSIGHT, SKILLS.AWARENESS],
  },
  ANGRY: {
    key: 'angry',
    label: 'Angry',
    affectedSkills: [SKILLS.DEXTERITY, SKILLS.COURTESY, SKILLS.STEALTH],
  },
  AFRAID: {
    key: 'afraid',
    label: 'Afraid',
    affectedSkills: [SKILLS.FORTITUDE, SKILLS.SPIRIT, SKILLS.LORE],
  },
  TROUBLED: {
    key: 'troubled',
    label: 'Troubled',
    affectedSkills: [SKILLS.CRAFT, SKILLS.AID, SKILLS.RIDDLE],
  }
}

export const STATES = {
  WEARY: {
    key: 'weary',
    label: 'Weary',
    coreAbility: CORE_ABILITIES.BODY,
    affectedSkills: [SKILLS.AWE, SKILLS.STRENGTH, SKILLS.DEXTERITY, SKILLS.FORTITUDE, SKILLS.CRAFT],
  },
  TWICE_WEARY: {
    key: 'twiceWeary',
    label: 'Twice Weary',
    coreAbility: CORE_ABILITIES.BODY,
  },
  MISERABLE: {
    key: 'miserable',
    label: 'Miserable',
    coreAbility: CORE_ABILITIES.HEART,
    affectedSkills: [SKILLS.PERFORM, SKILLS.INSIGHT, SKILLS.COURTESY, SKILLS.SPIRIT, SKILLS.AID],
  },
  TWICE_MISERABLE: {
    key: 'twiceMiserable',
    label: 'Twice Miserable',
    coreAbility: CORE_ABILITIES.HEART,
  },
  HELPLESS: {
    key: 'helpless',
    label: 'Helpless',
    coreAbility: CORE_ABILITIES.WITS,
    affectedSkills: [SKILLS.PERSUADE, SKILLS.AWARENESS, SKILLS.STEALTH, SKILLS.LORE, SKILLS.RIDDLE],
  },
  TWICE_HELPLESS: {
    key: 'twiceHelpless',
    label: 'Twice Helpless',
    coreAbility: CORE_ABILITIES.WITS,
  }
}

