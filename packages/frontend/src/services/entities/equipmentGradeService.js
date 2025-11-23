import BaseEntityService from './baseEntityService'

class EquipmentGradeService extends BaseEntityService {
  constructor() {
    super('/equipmentGrades', 'equipmentGrade')
  }
}

export default new EquipmentGradeService()