import BaseEntityService from './baseEntityService'
import { createDefaultKeeping } from '@shared/types'

class KeepingService extends BaseEntityService {
  constructor() {
    super('/keeping', 'keeping')
  }

  getDefaultEntity() {
    return createDefaultKeeping()
  }
}

export default new KeepingService()
