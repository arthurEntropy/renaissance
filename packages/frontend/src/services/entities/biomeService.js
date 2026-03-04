import BaseEntityService from './baseEntityService'
import { createDefaultBiome } from '@shared/types'

class BiomeService extends BaseEntityService {
  constructor() {
    super('/biomes', 'biome')
  }

  getDefaultEntity() {
    return createDefaultBiome()
  }
}

export default new BiomeService()
