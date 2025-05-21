import BaseService from './BaseService'

class EquipmentService extends BaseService {
  constructor() {
    super('http://localhost:3000/equipment', 'equipment')
  }

  // CRUD METHODS
  async createEquipment() {
    return this.create()
  }

  // Custom method specific to EquipmentService
  async createCustomEquipment() {
    // Use default equipment and modify it for custom equipment
    const customEquipment = this.getDefaultEntity()
    customEquipment.isCustom = true
    customEquipment.name = 'New Custom Item'

    return this.create(customEquipment)
  }

  async getAllEquipment() {
    return this.getAll()
  }

  async updateEquipment(equipment) {
    console.log('Updating equipment:', equipment)
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
      artUrl: null,
    }
  }
}

export default new EquipmentService()
