import BaseEntityService from './baseEntityService'

class AbilityService extends BaseEntityService {
  constructor() {
    super('/abilities', 'ability')
  }

  getDefaultEntity() {
    return {
      id: null,
      name: 'New Ability',
      description: '',
      isTrait: false,
      canBeActive: false,
      isActive: true,
      source: null,
      isDeleted: false,
      mp: null,
      xp: null,
    }
  }
}

export default new AbilityService()
