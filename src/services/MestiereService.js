import BaseService from './BaseService'

class MestieriService extends BaseService {
  constructor() {
    super(`${process.env.VUE_APP_API_URL || 'http://localhost:3000'}/mestieri`, 'mestiere')
  }

  // CRUD METHODS
  async createMestiere() {
    return this.create()
  }

  async getAllMestieri() {
    return this.getAll()
  }

  async updateMestiere(mestiere) {
    return this.update(mestiere)
  }

  async deleteMestiere(mestiere) {
    return this.delete(mestiere)
  }

  // DEFAULT MESTIERE
  static DEFAULT_ART_URL = 'https://cdn.midjourney.com/a8a36740-b7d3-4aef-bea3-a95039bec06f/0_2.png'

  getDefaultEntity() {
    return {
      id: null, // ID will be assigned by the backend
      name: 'New Mestiere',
      artUrls: [MestieriService.DEFAULT_ART_URL],
      isDeleted: false,
    }
  }
}

export default new MestieriService()
