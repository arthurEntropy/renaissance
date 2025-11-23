import BaseEntityService from '../baseEntityService'
import { createDefaultWorldElement } from '@shared/types'

class WorldElementService extends BaseEntityService {
  constructor() {
    super('/worldelements', 'world element')
  }

  getDefaultEntity() {
    return createDefaultWorldElement()
  }
}

export default new WorldElementService()
