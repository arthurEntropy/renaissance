import BaseEntityService from './baseEntityService'
import { createDefaultSkillCheckSuccess } from '@shared/types'

class SkillCheckSuccessService extends BaseEntityService {
  constructor() {
    super('/skillchecksuccesses', 'skill check success')
  }
  getDefaultEntity() {
    return createDefaultSkillCheckSuccess()
  }
}
export default new SkillCheckSuccessService()
