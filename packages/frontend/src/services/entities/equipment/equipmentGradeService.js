import BaseEntityService from '../baseEntityService'
import { createDefaultEquipmentGrade } from '@shared/types'

class EquipmentGradeService extends BaseEntityService {
  constructor() {
    super('/equipmentGrades', 'equipmentGrade')
  }

  getDefaultEntity() {
    return createDefaultEquipmentGrade()
  }
}

export default new EquipmentGradeService()