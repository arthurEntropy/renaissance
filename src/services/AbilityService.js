import axios from 'axios'

class AbilityService {
  constructor() {
    this.baseUrl = 'http://localhost:3000/abilities'
  }

  // CRUD METHODS
  async createAbility() {
    const newAbility = this.getDefaultAbility()
    try {
      const response = await axios.post(this.baseUrl, newAbility)
      return response.data
    } catch (error) {
      console.error('Error creating new ability:', error)
      throw error
    }
  }

  async getAllAbilities() {
    try {
      const response = await axios.get(this.baseUrl)
      return response.data
    } catch (error) {
      console.error('Error getting all abilities:', error)
      throw error
    }
  }

  async updateAbility(ability) {
    try {
      await axios.put(`${this.baseUrl}/${ability.id}`, ability)
    } catch (error) {
      console.error('Error saving ability:', error)
    }
  }

  async deleteAbility(ability) {
    ability.isDeleted = true // Soft delete
    this.updateAbility(ability)
  }

  // DEFAULT ABILITY
  getDefaultAbility() {
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
