import BaseEntityService from '../baseEntityService'
import { createDefaultMestiere } from '@shared/types'

class MestiereService extends BaseEntityService {
  constructor() {
    super('/mestieri', 'mestiere')
  }

  getDefaultEntity() {
    return createDefaultMestiere()
  }
}

export default new MestiereService()
