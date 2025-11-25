import BaseEntityService from '../baseEntityService'
import { createDefaultEquipmentSubtype } from '@shared/types'

class EquipmentSubtypeService extends BaseEntityService {
  constructor() {
    super('/equipmentSubtypes', 'equipmentSubtype')
  }

  getDefaultEntity() {
    return createDefaultEquipmentSubtype()
  }
}

export default new EquipmentSubtypeService()