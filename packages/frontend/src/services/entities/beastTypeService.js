import BaseEntityService from './baseEntityService'
import { createDefaultBeastType } from '@shared/types'

class BeastTypeService extends BaseEntityService {
  constructor() {
    super('/beastTypes', 'beast type')
  }

  getDefaultEntity() {
    return createDefaultBeastType()
  }
}

export default new BeastTypeService()
