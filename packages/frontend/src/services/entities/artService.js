import BaseEntityService from './baseEntityService'
import { createDefaultArt } from '@shared/types'

class ArtService extends BaseEntityService {
  constructor() {
    super('/art', 'art')
  }

  getDefaultEntity() {
    return createDefaultArt()
  }
}

export default new ArtService()
