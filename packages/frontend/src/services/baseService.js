import axios from 'axios'

/**
 * Base service class with common CRUD operations
 * To be extended by specific service classes
 */
class BaseService {
  constructor(baseUrl, defaultEntityName) {
    this.baseUrl = baseUrl
    this.defaultEntityName = defaultEntityName
  }

  /**
   * Create a new entity
   * @param {Object} defaultEntity - Optional custom default entity
   * @returns {Promise<Object>} The created entity
   */
  async create(defaultEntity = null) {
    const newEntity = defaultEntity || this.getDefaultEntity()
    try {
      const response = await axios.post(this.baseUrl, newEntity)
      return response.data
    } catch (error) {
      console.error(`Error creating new ${this.defaultEntityName}:`, error)
      throw error
    }
  }

  /**
   * Get all entities of this type
   * @returns {Promise<Array>} Array of entities
   */
  async getAll() {
    try {
      const response = await axios.get(this.baseUrl)
      return response.data
    } catch (error) {
      console.error(`Error getting all ${this.defaultEntityName}s:`, error)
      throw error
    }
  }

  /**
   * Update an entity
   * @param {Object} entity - The entity to update
   * @returns {Promise<Object>} The updated entity or response
   */
  async update(entity) {
    try {
      const response = await axios.put(`${this.baseUrl}/${entity.id}`, entity)
      return response.data
    } catch (error) {
      console.error(`Error updating ${this.defaultEntityName}:`, error)
      throw error
    }
  }

  /**
   * Soft delete an entity by setting isDeleted to true
   * @param {Object} entity - The entity to delete
   */
  async delete(entity) {
    entity.isDeleted = true // Soft delete
    return this.update(entity)
  }

  /**
   * Must be implemented by child classes
   * @returns {Object} Default entity template
   */
  getDefaultEntity() {
    throw new Error('getDefaultEntity must be implemented by child class')
  }
}

export default BaseService