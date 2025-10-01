import BaseService from './baseService.js'

class EquipmentSubtypeService extends BaseService {
  constructor() {
    super('/equipmentSubtypes', 'equipmentSubtype')
  }
}

export default new EquipmentSubtypeService()