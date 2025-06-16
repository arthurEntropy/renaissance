import BaseService from './BaseService'

class ExpansionService extends BaseService {
  constructor() {
    super('http://localhost:3000/expansions', 'expansion')
  }

  // CRUD METHODS
  async createExpansion() {
    return this.create()
  }

  async getAllExpansions() {
    return this.getAll()
  }

  async saveExpansion(expansion) {
    return this.update(expansion)
  }

  async deleteExpansion(expansion) {
    return this.delete(expansion)
  }

  // DEFAULT EXPANSION
  getDefaultEntity() {
    return {
      id: null, // ID will be assigned by the backend
      name: 'New Expansion',
      logoUrl: '',
      isDeleted: false,
    }
  }
}

export default new ExpansionService()
