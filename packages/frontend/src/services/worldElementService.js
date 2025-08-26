import BaseService from './baseService'

class WorldElementService extends BaseService {
  constructor() {
    super('/worldelements', 'world element')
  }

  getDefaultEntity() {
    return {
      id: null,
      name: 'New World Element',
      description: '',
      isDeleted: false,
    }
  }
}

export default new WorldElementService()
