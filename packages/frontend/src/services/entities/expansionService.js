import BaseEntityService from './baseEntityService'
import { createDefaultExpansion } from '@shared/types'

class ExpansionService extends BaseEntityService {
  constructor() {
    super('/expansions', 'expansion')
  }

  getDefaultEntity() {
    return createDefaultExpansion()
  }
}

export default new ExpansionService()
