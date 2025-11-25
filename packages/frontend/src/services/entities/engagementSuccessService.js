import BaseEntityService from './baseEntityService'
import { createDefaultEngagementSuccess } from '@shared/types'

class EngagementSuccessService extends BaseEntityService {
  constructor() {
    super('/engagementsuccesses', 'engagement success')
  }

  getDefaultEntity() {
    return createDefaultEngagementSuccess()
  }
}

export default new EngagementSuccessService()
