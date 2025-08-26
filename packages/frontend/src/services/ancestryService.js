import BaseService from './baseService'

class AncestryService extends BaseService {
  constructor() {
    super('/ancestries', 'ancestry')
  }

  getDefaultEntity() {
    return {
      id: null,
      name: 'New Ancestry',
      description: '',
      isDeleted: false,
    }
  }
}

export default new AncestryService()
