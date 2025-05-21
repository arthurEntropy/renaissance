import BaseService from './BaseService'

class WorldElementsService extends BaseService {
  constructor() {
    super('http://localhost:3000/worldelements', 'world element')
  }

  // Override methods with specific names for this service
  async createWorldElement() {
    return this.create()
  }

  async getAllWorldElements() {
    return this.getAll()
  }

  async saveWorldElement(worldElement) {
    return this.update(worldElement)
  }

  async deleteWorldElement(worldElement) {
    return this.delete(worldElement)
  }

  // DEFAULT WORLD ELEMENT
  static DEFAULT_ART_URL =
    'https://cdn.midjourney.com/47601870-3903-4c6f-98d3-b51e3770a9c1/0_0.png'

  getDefaultEntity() {
    return {
      id: null, // ID will be assigned by the backend
      name: 'New World Element',
      artUrls: [WorldElementsService.DEFAULT_ART_URL],
      description: '',
      isDeleted: false,
    }
  }
}

export default new WorldElementsService()
