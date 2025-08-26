import BaseService from './baseService'

class EquipmentService extends BaseService {
  constructor() {
    super('/equipment', 'equipment')
  }

  async createCustomEquipment() {
    const customEquipment = this.getDefaultEntity()
    customEquipment.isCustom = true
    customEquipment.name = 'New Custom Item'
    return this.create(customEquipment)
  }

  getDefaultEntity() {
    return {
      id: null,
      name: 'New Item',
      description: '',
      keeping: null,
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
