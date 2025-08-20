import BaseService from './baseService'

class CultureService extends BaseService {
  constructor() {
    super('/cultures', 'culture')
  }

  getDefaultEntity() {
    return {
      id: null,
      name: 'New Culture',
      description: '',
      isDeleted: false,
    }
  }
}

export default new CultureService()
