import BaseEntityService from './baseEntityService'

class EquipmentRangeService extends BaseEntityService {
  constructor() {
    super('/equipmentRanges', 'equipmentRange')
  }
}

export default new EquipmentRangeService()