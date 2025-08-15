import BaseService from './baseService'

class AncestryService extends BaseService {
  constructor() {
    super(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/ancestries`, 'ancestry')
  }

  // CRUD METHODS
  async createAncestry() {
    return this.create()
  }

  async getAllAncestries() {
    return this.getAll()
  }

  async updateAncestry(ancestry) {
    return this.update(ancestry)
  }

  async deleteAncestry(ancestry) {
    return this.delete(ancestry)
  }

  // DEFAULT ANCESTRY
  getDefaultEntity() {
    return {
      id: null, // ID will be assigned by the backend
      name: 'New Ancestry',
      description: '',
      isDeleted: false,
    }
  }
}

export default new AncestryService()
