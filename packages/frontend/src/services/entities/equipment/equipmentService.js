import BaseEntityService from '../baseEntityService'
import { createDefaultEquipment } from '@shared/types'

class EquipmentService extends BaseEntityService {
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
    return createDefaultEquipment()
  }
}

export default new EquipmentService()
