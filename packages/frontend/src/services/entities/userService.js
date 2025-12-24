import BaseEntityService from './baseEntityService'
import { createDefaultUser } from '@shared/types'
import apiClient from '../api/apiClient'

class UserService extends BaseEntityService {
  constructor() {
    super('/users', 'user')
  }

  async getCurrentProfile() {
    try {
      const response = await apiClient.get('/users/profile')
      return response.data
    } catch (error) {
      console.error('Error getting current user profile:', error)
      throw error
    }
  }

  async updateCurrentProfile(updates) {
    try {
      const response = await apiClient.put('/users/profile', updates)
      return response.data
    } catch (error) {
      console.error('Error updating user profile:', error)
      throw error
    }
  }

  async getAllUsers() {
    try {
      const response = await apiClient.get('/users/admin/all')
      return response.data
    } catch (error) {
      console.error('Error getting all users:', error)
      throw error
    }
  }

  async updateUser(userId, updates) {
    try {
      const response = await apiClient.put(`/users/admin/${userId}`, updates)
      return response.data
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  async deleteUser(userId) {
    try {
      const response = await apiClient.delete(`/users/admin/${userId}`)
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