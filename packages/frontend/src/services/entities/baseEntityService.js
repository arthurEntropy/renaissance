import apiClient from '../api/apiClient'

class BaseEntityService {
  constructor(endpoint, entityName) {
    this.endpoint = endpoint
    this.entityName = entityName
  }

  async create(overrides = {}) {
    const newEntity = { ...this.getDefaultEntity(), ...overrides }
    try {
      const response = await apiClient.post(this.endpoint, newEntity)
      return response.data
    } catch (error) {
      console.error(`Error creating ${this.entityName}:`, error)
      throw error
    }
  }

  async getAll() {
    try {
      const response = await apiClient.get(this.endpoint)
      return response.data
    } catch (error) {
      console.error(`Error getting all ${this.entityName}s:`, error)
      throw error
    }
  }

  async update(entity) {
    try {
      const response = await apiClient.put(`${this.endpoint}/${entity.id}`, entity)
      return response.data
    } catch (error) {
      console.error(`Error updating ${this.entityName}:`, error)
      throw error
    }
  }

  async delete(entity) {
    entity.isDeleted = true // Soft delete
    return this.update(entity)
  }

  getDefaultEntity() {
    throw new Error('getDefaultEntity must be implemented by child class')
  }
}

export default BaseEntityService