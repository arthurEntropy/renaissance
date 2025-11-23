import BaseEntityService from './baseEntityService'

class KeepingService extends BaseEntityService {
  constructor() {
    super('/keeping', 'keeping')
  }
}

export default new KeepingService()
