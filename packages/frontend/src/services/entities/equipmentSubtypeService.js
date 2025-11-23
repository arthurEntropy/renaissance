import BaseEntityService from './baseEntityService'

class EquipmentSubtypeService extends BaseEntityService {
  constructor() {
    super('/equipmentSubtypes', 'equipmentSubtype')
  }
}

export default new EquipmentSubtypeService()