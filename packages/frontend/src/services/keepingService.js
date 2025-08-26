import BaseService from './baseService.js'

class KeepingService extends BaseService {
  constructor() {
    super('/keeping', 'keeping')
  }
}

export default new KeepingService()
