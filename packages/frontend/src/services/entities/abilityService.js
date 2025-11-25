import BaseEntityService from './baseEntityService'
import { createDefaultAbility } from '@shared/types'

class AbilityService extends BaseEntityService {
  constructor() {
    super('/abilities', 'ability')
  }

  getDefaultEntity() {
    return createDefaultAbility()
  }
}

export default new AbilityService()
