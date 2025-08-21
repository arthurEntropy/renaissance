import BaseService from './baseService.js'

class StandardOfLivingService extends BaseService {
  constructor() {
    super('/standardsOfLiving', 'standard of living')
  }
}

export default new StandardOfLivingService()
