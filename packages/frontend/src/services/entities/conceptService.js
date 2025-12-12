import BaseEntityService from './baseEntityService'
import apiClient from '../api/apiClient'
import { createDefaultGameConcept } from '@shared/types'
import { ConceptType } from '@shared/constants/conceptTypes'

class ConceptService extends BaseEntityService {
  constructor() {
    super('/concepts', 'concept')
    this.api = apiClient
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

  /**
   * Fetch concepts filtered by type
   * @param {string|string[]} conceptType - Single type or array of types
   * @returns {Promise<Array>} Filtered concepts
   */
  async fetchByType(conceptType) {
    const types = Array.isArray(conceptType) ? conceptType.join(',') : conceptType
    const response = await this.api.get(`${this.endpoint}?conceptType=${types}`)
    return response.data
  }

  /**
   * Fetch only ancestries
   * @returns {Promise<Array>}
   */
  async fetchAncestries() {
    return this.fetchByType(ConceptType.ANCESTRY)
  }

  /**
   * Fetch only cultures
   * @returns {Promise<Array>}
   */
  async fetchCultures() {
    return this.fetchByType(ConceptType.CULTURE)
  }

  /**
   * Fetch only mestieri
   * @returns {Promise<Array>}
   */
  async fetchMestieri() {
    return this.fetchByType(ConceptType.MESTIERE)
  }

  /**
   * Fetch only world elements
   * @returns {Promise<Array>}
   */
  async fetchWorldElements() {
    return this.fetchByType(ConceptType.WORLD_ELEMENT)
  }
}

export default new ConceptService()
