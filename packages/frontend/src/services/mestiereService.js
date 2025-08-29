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
      artUrls: ['https://cdn.midjourney.com/a8a36740-b7d3-4aef-bea3-a95039bec06f/0_2.png'],
      expansionLogoUrl: '',
    }
  }
}

export default new MestieriService()
