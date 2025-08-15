import BaseService from './baseService'

class EquipmentService extends BaseService {
  constructor() {
    super(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/equipment`, 'equipment')
  }

  // CRUD METHODS
  async createEquipment() {
    return this.create()
  }

  // Equipment is the only entity that allows custom items to be created by the user
  async createCustomEquipment() {
    const customEquipment = this.getDefaultEntity()
    customEquipment.isCustom = true
    customEquipment.name = 'New Custom Item'
    return this.create(customEquipment)
  }

  async getAllEquipment() {
    return this.getAll()
  }

  async updateEquipment(equipment) {
    return this.update(equipment)
  }

  async deleteEquipment(equipment) {
    return this.delete(equipment)
  }

  // DEFAULT EQUIPMENT
  getDefaultEntity() {
    return {
      id: null, // ID will be assigned by the backend
      name: 'New Item',
      description: '',
      standardOfLiving: null,
      source: null,
      weight: 0,
      isMelee: false,
      damageDice: [],
      engagementDice: [],
      engagementSuccesses: [],
      skillMods: [],
      isDeleted: false,
      isCustom: false,
      artUrl: null, // No default art for equipment
    }
  }
}

export default new EquipmentService()
