import BaseEntityService from './baseEntityService'
import { createDefaultCharacter } from '@shared/types'

class CharacterService extends BaseEntityService {
  constructor() {
    super('/characters', 'character')
  }

  getDefaultEntity() {
    return createDefaultCharacter()
  }
}

export default new CharacterService()
