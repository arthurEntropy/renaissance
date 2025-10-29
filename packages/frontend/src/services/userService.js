import BaseService from './baseService'
import AuthService from './authService'

class UserService extends BaseService {
  constructor() {
    super('/users', 'user')
  }

  // Get current user's profile
  async getCurrentProfile() {
    try {
      const token = await AuthService.getIdToken()
      const response = await fetch(`${this.baseUrl}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to get user profile')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error getting current user profile:', error)
      throw error
    }
  }

  // Update current user's profile
  async updateCurrentProfile(updates) {
    try {
      const token = await AuthService.getIdToken()
      const response = await fetch(`${this.baseUrl}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      })
      
      if (!response.ok) {
        throw new Error('Failed to update user profile')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error updating user profile:', error)
      throw error
    }
  }

  // Admin: Get all users
  async getAllUsers() {
    try {
      const token = await AuthService.getIdToken()
      const response = await fetch(`${this.baseUrl}/admin/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to get all users')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error getting all users:', error)
      throw error
    }
  }

  // Admin: Update user
  async updateUser(userId, updates) {
    try {
      const token = await AuthService.getIdToken()
      const response = await fetch(`${this.baseUrl}/admin/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      })
      
      if (!response.ok) {
        throw new Error('Failed to update user')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  // Admin: Delete user
  async deleteUser(userId) {
    try {
      const token = await AuthService.getIdToken()
      const response = await fetch(`${this.baseUrl}/admin/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete user')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  }

  // Admin: Approve user
  async approveUser(userId) {
    return this.updateUser(userId, { status: 'approved' })
  }

  // Admin: Set user role
  async setUserRole(userId, role) {
    return this.updateUser(userId, { role })
  }

  getDefaultEntity() {
    return {
      id: null,
      email: '',
      name: '',
      role: 'user',
      status: 'pending',
      isDeleted: false,
      preferences: {
        theme: 'dark',
        notifications: true,
      },
      characters: [],
    }
  }
}

export default new UserService()