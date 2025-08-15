import BaseService from './baseService'

class WorldElementService extends BaseService {
  constructor() {
    super(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/worldelements`, 'world element')
  }

  // CRUD METHODS
  async createWorldElement() {
    return this.create()
  }

  async getAllWorldElements() {
    return this.getAll()
  }

  async updateWorldElement(worldElement) {
    return this.update(worldElement)
  }

  async deleteWorldElement(worldElement) {
    return this.delete(worldElement)
  }

  // DEFAULT WORLD ELEMENT
  getDefaultEntity() {
    return {
      id: null, // ID will be assigned by the backend
      name: 'New World Element',
      description: '',
      isDeleted: false,
    }
  }
}

export default new WorldElementService()
