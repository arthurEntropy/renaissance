import BaseEntityService from './baseEntityService'

class EquipmentTypeService extends BaseEntityService {
  constructor() {
    super('/equipmentTypes', 'equipmentType')
  }
}

export default new EquipmentTypeService()