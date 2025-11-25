import BaseEntityService from '../baseEntityService'
import { createDefaultAncestry } from '@shared/types'

class AncestryService extends BaseEntityService {
  constructor() {
    super('/ancestries', 'ancestry')
  }

  getDefaultEntity() {
    return createDefaultAncestry()
  }
}

export default new AncestryService()
