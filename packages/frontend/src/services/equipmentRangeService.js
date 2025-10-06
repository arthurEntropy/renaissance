import BaseService from './baseService.js'

class EquipmentRangeService extends BaseService {
  constructor() {
    super('/equipmentRanges', 'equipmentRange')
  }
}

export default new EquipmentRangeService()