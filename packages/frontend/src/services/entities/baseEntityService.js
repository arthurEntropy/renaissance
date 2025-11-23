import axios from 'axios'
import AuthService from '../auth/authService'

class BaseEntityService {
  constructor(endpoint, entityName) {
    this.baseUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${endpoint}`
    this.entityName = entityName
  }

  async getAuthHeaders() {
    const token = await AuthService.getIdToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  async create(defaultEntity = null) {
    const newEntity = defaultEntity || this.getDefaultEntity()
    try {
      const authHeaders = await this.getAuthHeaders()
      const response = await axios.post(this.baseUrl, newEntity, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        }
      })
      return response.data
    } catch (error) {
      console.error(`Error creating ${this.entityName}:`, error)
      throw error
    }
  }

  async getAll() {
    try {
      const authHeaders = await this.getAuthHeaders()
      const response = await axios.get(this.baseUrl, {
        headers: authHeaders
      })
      return response.data
    } catch (error) {
      console.error(`Error getting all ${this.entityName}s:`, error)
      throw error
    }
  }

  async update(entity) {
    try {
      const authHeaders = await this.getAuthHeaders()
      const response = await axios.put(`${this.baseUrl}/${entity.id}`, entity, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        }
      })
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