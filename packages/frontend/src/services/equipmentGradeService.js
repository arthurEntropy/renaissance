import BaseService from './baseService.js'

class EquipmentGradeService extends BaseService {
  constructor() {
    super('/equipmentGrades', 'equipmentGrade')
  }
}

export default new EquipmentGradeService()