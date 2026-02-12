export const ActionType = {
  TRAIT: 'a1b2c3d4-e5f6-4a1b-9c8d-7e6f5a4b3c2d',
  ACTION: 'b2c3d4e5-f6a1-4b2c-ad9e-8f7a6b5c4d3e',
  HALF_ACTION: 'c3d4e5f6-a1b2-4c3d-be0f-9a8b7c6d5e4f',
  FREE_ACTION: 'd4e5f6a1-b2c3-4d4e-cf1a-0b9c8d7e6f5a',
  REACTION: 'e5f6a1b2-c3d4-4e5f-da2b-1c0d9e8f7a6b',
  RITUAL: 'f6a1b2c3-d4e5-4f6a-eb3c-2d1e0f9a8b7c',
}

export const ACTION_TYPE_LABELS = {
  [ActionType.TRAIT]: 'Trait',
  [ActionType.ACTION]: 'Action',
  [ActionType.HALF_ACTION]: 'Half Action',
  [ActionType.FREE_ACTION]: 'Free Action',
  [ActionType.REACTION]: 'Reaction',
  [ActionType.RITUAL]: 'Ritual',
}

export function isValidActionType(type) {
  return Object.values(ActionType).includes(type)
}

export function getActionTypeLabel(actionType) {
  return ACTION_TYPE_LABELS[actionType] || actionType
}
