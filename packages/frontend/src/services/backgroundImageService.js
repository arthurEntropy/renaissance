import BaseService from './baseService'

class BackgroundImageService extends BaseService {
  constructor() {
    super('/backgroundImages', 'backgroundImage')
  }

  getDefaultEntity() {
    return {
      id: null,
      imageUrl: '',
      isDeleted: false,
    }
  }
}

export default new BackgroundImageService()
