import BaseEntityService from '../baseEntityService'
import { createDefaultCulture } from '@shared/types'

class CultureService extends BaseEntityService {
  constructor() {
    super('/cultures', 'culture')
  }

  getDefaultEntity() {
    return createDefaultCulture()
  }
}

export default new CultureService()
