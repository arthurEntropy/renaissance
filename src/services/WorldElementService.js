import axios from 'axios'

class WorldElementsService {
  constructor() {
    this.baseUrl = 'http://localhost:3000/worldelements'
  }

  // CRUD METHODS
  async createWorldElement() {
    const newWorldElement = this.getDefaultWorldElement()
    try {
      const response = await axios.post(this.baseUrl, newWorldElement)
      return response.data
    } catch (error) {
      console.error('Error creating new world element:', error)
      throw error
    }
  }

  async getAllWorldElements() {
    try {
      const response = await axios.get(this.baseUrl)
      return response.data
    } catch (error) {
      console.error('Error getting all world elements:', error)
      throw error
    }
  }

  async saveWorldElement(worldElement) {
    try {
      await axios.put(`${this.baseUrl}/${worldElement.id}`, worldElement)
    } catch (error) {
      console.error('Error saving world element:', error)
      throw error
    }
  }

  async deleteWorldElement(worldElement) {
    worldElement.isDeleted = true
    this.saveWorldElement(worldElement)
  }

  // DEFAULT WORLD ELEMENT
  static DEFAULT_ART_URL =
    'https://cdn.midjourney.com/47601870-3903-4c6f-98d3-b51e3770a9c1/0_0.png'

  getDefaultWorldElement() {
    return {
      id: null, // ID will be assigned by the backend
      name: 'New World Element',
      artUrls: [WorldElementsService.DEFAULT_ART_URL],
      description: '',
      isDeleted: false,
    }
  }
}

export default new WorldElementsService()
