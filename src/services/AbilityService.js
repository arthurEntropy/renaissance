import BaseService from './BaseService'

class AbilityService extends BaseService {
  constructor() {
    super('http://localhost:3000/abilities', 'ability')
  }

  // Override methods with specific names for this service
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
  getDefaultResource() {
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
