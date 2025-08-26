import BaseService from './baseService'

class ExpansionService extends BaseService {
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
