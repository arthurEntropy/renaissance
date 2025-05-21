import BaseService from './BaseService'

class MestieriService extends BaseService {
  constructor() {
    super('http://localhost:3000/mestieri', 'mestiere')
  }

  // Override methods with specific names for this service
  async createMestiere() {
    return this.create()
  }

  async getAllMestieri() {
    return this.getAll()
  }

  async saveMestiere(mestiere) {
    return this.update(mestiere)
  }

  async deleteMestiere(mestiere) {
    return this.delete(mestiere)
  }

  // DEFAULT MESTIERE
  static DEFAULT_ART_URL = 'https://cdn.midjourney.com/default-mestiere-art.png'

  getDefaultResource() {
    return {
      id: null, // ID will be assigned by the backend
      name: 'New Mestiere',
      artUrls: [MestieriService.DEFAULT_ART_URL],
      isDeleted: false,
    }
  }
}

export default new MestieriService()
