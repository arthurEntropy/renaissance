import BaseEntityService from '../baseEntityService'
import { createDefaultEquipmentRange } from '@shared/types'

class EquipmentRangeService extends BaseEntityService {
  constructor() {
    super('/equipmentRanges', 'equipmentRange')
  }

  getDefaultEntity() {
    return createDefaultEquipmentRange()
  }
}

export default new EquipmentRangeService()