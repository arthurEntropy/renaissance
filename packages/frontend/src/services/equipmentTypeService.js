import BaseService from './baseService.js'

class EquipmentTypeService extends BaseService {
  constructor() {
    super('/equipmentTypes', 'equipmentType')
  }
}

export default new EquipmentTypeService()