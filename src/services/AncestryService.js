import BaseService from './BaseService'

class AncestryService extends BaseService {
  constructor() {
    super('http://localhost:3000/ancestries', 'ancestry')
  }

  // Override methods with specific names for this service
  async createAncestry() {
    return this.create()
  }

  async getAllAncestries() {
    return this.getAll()
  }

  async saveAncestry(ancestry) {
    return this.update(ancestry)
  }

  async deleteAncestry(ancestry) {
    return this.delete(ancestry)
  }

  // DEFAULT ANCESTRY
  static DEFAULT_ART_URL =
    'https://cdn.midjourney.com/a8a36740-b7d3-4aef-bea3-a95039bec06f/0_2.png'

  getDefaultEntity() {
    return {
      id: null, // ID will be assigned by the backend
      name: 'New Ancestry',
      artUrls: [AncestryService.DEFAULT_ART_URL],
      isDeleted: false,
    }
  }
}

export default new AncestryService()
