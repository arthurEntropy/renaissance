import BaseEntityService from './baseEntityService'

class ActionCostService extends BaseEntityService {
  constructor() {
    super('/actionCosts', 'actionCost')
  }

  getDefaultEntity() {
    return {
      id: null,
      name: 'New Action Cost',
      index: 0,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    }
  }
}

export default new ActionCostService()
