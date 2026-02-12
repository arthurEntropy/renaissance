import BaseEntityService from './baseEntityService'

class ActionTypeService extends BaseEntityService {
  constructor() {
    super('/actionTypes', 'actionType')
  }

  getDefaultEntity() {
    return {
      id: null,
      name: 'New Action Type',
      description: '',
      index: 0,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    }
  }
}

export default new ActionTypeService()
