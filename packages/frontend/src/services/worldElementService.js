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
      artUrls: ['https://cdn.midjourney.com/a8a36740-b7d3-4aef-bea3-a95039bec06f/0_2.png'],
      expansionLogoUrl: '',
    }
  }
}

export default new WorldElementService()
