import BaseService from './BaseService'

class CultureService extends BaseService {
  constructor() {
    super(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/cultures`, 'culture')
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
  getDefaultEntity() {
    return {
      id: null, // ID will be assigned by the backend
      name: 'New Culture',
      description: '',
      isDeleted: false,
    }
  }
}

export default new CultureService()
