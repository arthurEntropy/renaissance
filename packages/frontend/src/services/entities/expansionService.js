import BaseEntityService from './baseEntityService'

class ExpansionService extends BaseEntityService {
  constructor() {
    super('/expansions', 'expansion')
  }

  getDefaultEntity() {
    return {
      id: null,
      name: 'New Expansion',
      logoUrl: '',
      isDeleted: false,
    }
  }
}

export default new ExpansionService()
