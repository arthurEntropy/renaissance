import axios from 'axios'

/**
 * Base service class with common CRUD operations
 * To be extended by specific service classes
 */
class BaseService {
  constructor(baseUrl, defaultResourceName) {
    this.baseUrl = baseUrl
    this.defaultResourceName = defaultResourceName
  }

  /**
   * Create a new resource
   * @param {Object} defaultResource - Optional custom default resource
   * @returns {Promise<Object>} The created resource
   */
  async create(defaultResource = null) {
    const newResource = defaultResource || this.getDefaultResource()
    try {
      const response = await axios.post(this.baseUrl, newResource)
      return response.data
    } catch (error) {
      console.error(`Error creating new ${this.defaultResourceName}:`, error)
      throw error
    }
  }

  /**
   * Get all resources of this type
   * @returns {Promise<Array>} Array of resources
   */
  async getAll() {
    try {
      const response = await axios.get(this.baseUrl)
      return response.data
    } catch (error) {
      console.error(`Error getting all ${this.defaultResourceName}s:`, error)
      throw error
    }
  }

  /**
   * Update a resource
   * @param {Object} resource - The resource to update
   * @returns {Promise<Object>} The updated resource or response
   */
  async update(resource) {
    try {
      const response = await axios.put(`${this.baseUrl}/${resource.id}`, resource)
      return response.data
    } catch (error) {
      console.error(`Error updating ${this.defaultResourceName}:`, error)
      throw error
    }
  }

  /**
   * Soft delete a resource by setting isDeleted to true
   * @param {Object} resource - The resource to delete
   */
  async delete(resource) {
    resource.isDeleted = true // Soft delete
    return this.update(resource)
  }

  /**
   * Must be implemented by child classes
   * @returns {Object} Default resource template
   */
  getDefaultResource() {
    throw new Error('getDefaultResource must be implemented by child class')
  }
}

export default BaseService