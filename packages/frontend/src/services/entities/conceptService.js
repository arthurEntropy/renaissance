import BaseEntityService from './baseEntityService'
import { createDefaultGameConcept } from '@shared/types'

class ConceptService extends BaseEntityService {
  constructor() {
    super('/concepts', 'concept')
  }

  /**
   * Get default entity for a specific concept type
   * @param {string} conceptType - ConceptType enum value
   * @returns {Object} Default concept entity
   */
  getDefaultEntity(conceptType) {
    if (!conceptType) {
      throw new Error('conceptType is required when creating a concept')
    }
    return createDefaultGameConcept(conceptType)
  }
}

export default new ConceptService()
