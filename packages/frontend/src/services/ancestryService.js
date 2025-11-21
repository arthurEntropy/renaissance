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
      artUrls: ['https://cdn.midjourney.com/a8a36740-b7d3-4aef-bea3-a95039bec06f/0_2.png'],
      faces: [],
      places: [],
      backgroundImage: '',
      expansion: '',
      hooks: [],
      playlists: [],
      names: '',
      occupations: '',
      publicHouses: '',
      vittles: '',
      pointsOfInterest: '',
      floraFauna: '',
    }
  }
}

export default new AncestryService()
