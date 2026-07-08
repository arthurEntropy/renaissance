import BaseEntityService from './baseEntityService'
import { createDefaultArtPlaceholder } from '@shared/types'

class ArtPlaceholderService extends BaseEntityService {
  constructor() {
    super('/artPlaceholders', 'artPlaceholder')
  }

  getDefaultEntity() {
    return createDefaultArtPlaceholder()
  }
}

export default new ArtPlaceholderService()
