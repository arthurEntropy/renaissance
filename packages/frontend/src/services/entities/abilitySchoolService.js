import BaseEntityService from './baseEntityService'
import { createDefaultAbilitySchool } from '@shared/types'

class AbilitySchoolService extends BaseEntityService {
  constructor() {
    super('/abilitySchools', 'ability school')
  }

  getDefaultEntity() {
    return createDefaultAbilitySchool()
  }
}

export default new AbilitySchoolService()
