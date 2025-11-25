import BaseEntityService from './baseEntityService'
import { createDefaultBackgroundImage } from '@shared/types'

class BackgroundImageService extends BaseEntityService {
  constructor() {
    super('/backgroundImages', 'backgroundImage')
  }

  getDefaultEntity() {
    return createDefaultBackgroundImage()
  }
}

export default new BackgroundImageService()
