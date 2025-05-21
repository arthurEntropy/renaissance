import axios from 'axios'
import BaseService from './BaseService'

class CultureService extends BaseService {
  constructor() {
    super('http://localhost:3000/cultures', 'culture')
  }

  sanitizeForJSON(obj) {
    // Clone the object without circular references
    return JSON.parse(JSON.stringify(obj))
  }

  // Override methods with specific names for this service
  async createCulture() {
    return this.create()
  }

  async getAllCultures() {
    return this.getAll()
  }

  async updateCulture(culture) {
    try {
      // Sanitize the culture object before sending to the server
      const sanitizedCulture = this.sanitizeForJSON(culture)
      const response = await axios.put(
        `${this.baseUrl}/${culture.id}`,
        sanitizedCulture,
      )
      return response.data
    } catch (error) {
      console.error('Error saving culture:', error)
      throw error
    }
  }

  async deleteCulture(culture) {
    return this.delete(culture)
  }

  // DEFAULT CULTURE
  static DEFAULT_ART_URL =
    'https://cdn.midjourney.com/a8a36740-b7d3-4aef-bea3-a95039bec06f/0_2.png'

  getDefaultEntity() {
    return {
      id: null, // ID will be assigned by the backend
      name: 'New Culture',
      artUrls: [CultureService.DEFAULT_ART_URL],
      isDeleted: false,
    }
  }
}

export default new CultureService()
