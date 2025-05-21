import axios from 'axios'

class EquipmentService {
  constructor() {
    this.baseUrl = 'http://localhost:3000/equipment'
  }

  // CRUD METHODS
  async createEquipment() {
    const newEquipment = this.getDefaultEquipment()
    try {
      const response = await axios.post(this.baseUrl, newEquipment)
      return response.data
    } catch (error) {
      console.error('Error creating new equipment:', error)
      throw error
    }
  }

  async createCustomEquipment() {
    // Use default equipment and modify it for custom equipment
    const customEquipment = this.getDefaultEquipment()
    customEquipment.isCustom = true
    customEquipment.name = 'New Custom Item'

    try {
      const response = await axios.post(this.baseUrl, customEquipment)
      return response.data
    } catch (error) {
      console.error('Error creating custom equipment:', error)
      throw error
    }
  }

  async getAllEquipment() {
    try {
      const response = await axios.get(this.baseUrl)
      return response.data
    } catch (error) {
      console.error('Error getting all equipment:', error)
      throw error
    }
  }

  async updateEquipment(equipment) {
    console.log('Updating equipment:', equipment)
    try {
      await axios.put(`${this.baseUrl}/${equipment.id}`, equipment)
    } catch (error) {
      console.error('Error saving equipment:', error)
    }
  }

  async deleteEquipment(equipment) {
    equipment.isDeleted = true // Soft delete
    this.updateEquipment(equipment)
  }

  // DEFAULT EQUIPMENT
  getDefaultEquipment() {
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
