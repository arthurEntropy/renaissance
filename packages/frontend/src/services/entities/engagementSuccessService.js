import BaseEntityService from './baseEntityService'

class EngagementSuccessService extends BaseEntityService {
  constructor() {
    super('/engagementsuccesses', 'engagement success')
  }

  getDefaultEntity() {
    return {
      id: null,
      name: 'New Engagement Success',
      description: '',
      isDeleted: false,
    }
  }
}

export default new EngagementSuccessService()
