import axios from 'axios'

class CultureService {
  constructor() {
    this.baseUrl = 'http://localhost:3000/cultures'
  }

  sanitizeForJSON(obj) {
    // Clone the object without circular references
    return JSON.parse(JSON.stringify(obj))
  }

  // CRUD METHODS
  async createCulture() {
    const newCulture = this.getDefaultCulture()
    try {
      const response = await axios.post(this.baseUrl, newCulture)
      return response.data
    } catch (error) {
      console.error('Error creating new culture:', error)
      throw error
    }
  }

  async getAllCultures() {
    try {
      const response = await axios.get(this.baseUrl)
      return response.data
    } catch (error) {
      console.error('Error getting all cultures:', error)
      throw error
    }
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
    culture.isDeleted = true // Soft delete
    this.updateCulture(culture)
  }

  // DEFAULT CULTURE
  static DEFAULT_ART_URL =
    'https://cdn.midjourney.com/a8a36740-b7d3-4aef-bea3-a95039bec06f/0_2.png'

  getDefaultCulture() {
    return {
      id: null, // ID will be assigned by the backend
      name: 'New Culture',
      artUrls: [CultureService.DEFAULT_ART_URL],
      isDeleted: false,
    }
  }
}

export default new CultureService()
