import BaseService from './BaseService'

class CultureService extends BaseService {
  constructor() {
    super(`${process.env.VUE_APP_API_URL || 'http://localhost:3000'}/cultures`, 'culture')
  }

  // CRUD METHODS
  async createCulture() {
    return this.create()
  }

  async getAllCultures() {
    return this.getAll()
  }

  async updateCulture(culture) {
    return this.update(culture)
  }

  async deleteCulture(culture) {
    return this.delete(culture)
  }

  // DEFAULT CULTURE
  static DEFAULT_ART_URL =
    'https://cdn.midjourney.com/a8a36740-b7d3-4aef-bea3-a95039bec06f/0_2.png'

  getDefaultEntity() {
    return {
      id: null, // ID will be assigned by the backend
      name: 'New Culture',
      artUrls: [CultureService.DEFAULT_ART_URL],
      isDeleted: false,
    }
  }
}

export default new CultureService()
