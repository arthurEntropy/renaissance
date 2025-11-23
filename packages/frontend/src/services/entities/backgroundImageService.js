import BaseEntityService from './baseEntityService'

class BackgroundImageService extends BaseEntityService {
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
