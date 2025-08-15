import BaseService from './baseService'

class AbilityService extends BaseService {
  constructor() {
    super(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/abilities`, 'ability')
  }

  // CRUD METHODS
  async createAbility() {
    return this.create()
  }

  async getAllAbilities() {
    return this.getAll()
  }

  async updateAbility(ability) {
    return this.update(ability)
  }

  async deleteAbility(ability) {
    return this.delete(ability)
  }

  // DEFAULT ABILITY
  getDefaultEntity() {
    return {
      id: null, // ID will be assigned by the backend
      name: 'New Ability',
      description: '',
      isTrait: false,
      canBeActive: false,
      isActive: true,
      source: null,
      isDeleted: false,
      mp: null,
      xp: null,
    }
  }
}

export default new AbilityService()
