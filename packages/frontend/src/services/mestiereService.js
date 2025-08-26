import BaseService from './baseService'

class MestieriService extends BaseService {
  constructor() {
    super('/mestieri', 'mestiere')
  }

  getDefaultEntity() {
    return {
      id: null,
      name: 'New Mestiere',
      isDeleted: false,
    }
  }
}

export default new MestieriService()
