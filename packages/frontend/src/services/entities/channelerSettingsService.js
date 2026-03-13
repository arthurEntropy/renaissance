import BaseEntityService from './baseEntityService'
import { createDefaultChannelerSettings } from '@shared/types'

class ChannelerSettingsService extends BaseEntityService {
  constructor() {
    super('/channelerSettings', 'channeler settings')
  }

  getDefaultEntity() {
    return createDefaultChannelerSettings()
  }
}

export default new ChannelerSettingsService()
