import BaseService from './baseService'

class EngagementSuccessService extends BaseService {
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
