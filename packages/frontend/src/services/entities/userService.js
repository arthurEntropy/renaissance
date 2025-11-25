import BaseEntityService from './baseEntityService'
import { createDefaultUser } from '@shared/types'
import axios from 'axios'

class UserService extends BaseEntityService {
  constructor() {
    super('/users', 'user')
  }

  async getCurrentProfile() {
    try {
      const authHeaders = await this.getAuthHeaders()
      const response = await axios.get(`${this.baseUrl}/profile`, {
        headers: authHeaders
      })
      return response.data
    } catch (error) {
      console.error('Error getting current user profile:', error)
      throw error
    }
  }

  async updateCurrentProfile(updates) {
    try {
      const authHeaders = await this.getAuthHeaders()
      const response = await axios.put(`${this.baseUrl}/profile`, updates, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        }
      })
      return response.data
    } catch (error) {
      console.error('Error updating user profile:', error)
      throw error
    }
  }

  async getAllUsers() {
    try {
      const authHeaders = await this.getAuthHeaders()
      const response = await axios.get(`${this.baseUrl}/admin/all`, {
        headers: authHeaders
      })
      return response.data
    } catch (error) {
      console.error('Error getting all users:', error)
      throw error
    }
  }

  async updateUser(userId, updates) {
    try {
      const authHeaders = await this.getAuthHeaders()
      const response = await axios.put(`${this.baseUrl}/admin/${userId}`, updates, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        }
      })
      return response.data
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  async deleteUser(userId) {
    try {
      const authHeaders = await this.getAuthHeaders()
      const response = await axios.delete(`${this.baseUrl}/admin/${userId}`, {
        headers: authHeaders
      })
      return response.data
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  }

  async approveUser(userId) {
    return this.updateUser(userId, { status: 'approved' })
  }

  async setUserRole(userId, role) {
    return this.updateUser(userId, { role })
  }

  getDefaultEntity() {
    return createDefaultUser()
  }
}

export default new UserService()