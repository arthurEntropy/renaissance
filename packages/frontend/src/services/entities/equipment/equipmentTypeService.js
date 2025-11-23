import BaseEntityService from '../baseEntityService'
import { createDefaultEquipmentType } from '@shared/types'

class EquipmentTypeService extends BaseEntityService {
  constructor() {
    super('/equipmentTypes', 'equipmentType')
  }

  getDefaultEntity() {
    return createDefaultEquipmentType()
  }
}

export default new EquipmentTypeService()