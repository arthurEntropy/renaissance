import axios from 'axios'

class RulesService {
  constructor() {
    this.baseUrl = 'http://localhost:3000/rules'
  }

  async createSection() {
    const defaultSection = this.getDefaultSection()
    try {
      const response = await axios.post(this.baseUrl, defaultSection)
      return response.data
    } catch (error) {
      console.error('Error creating new section:', error)
      throw error
    }
  }

  async getAllSections() {
    try {
      const response = await axios.get(this.baseUrl)
      return response.data
    } catch (error) {
      console.error('Error getting all sections:', error)
      throw error
    }
  }

  async updateSection(section) {
    try {
      const response = await axios.put(`${this.baseUrl}/${section.id}`, section)
      return response.data
    } catch (error) {
      console.error('Error updating section:', error)
      throw error
    }
  }

  async deleteSection(section) {
    try {
      section.isDeleted = true // Soft delete
      return await this.updateSection(section)
    } catch (error) {
      console.error('Error deleting section:', error)
      throw error
    }
  }

  async reorderSections(sections) {
    try {
      const updatePromises = sections.map((section, index) => {
        const updatedSection = { ...section, index }
        return this.updateSection(updatedSection)
      })
      await Promise.all(updatePromises)
      return sections
    } catch (error) {
      console.error('Error reordering sections:', error)
      throw error
    }
  }

  getDefaultSection() {
    return {
      id: null, // ID will be assigned by the backend
      name: 'New Section',
      content: '',
      imageUrl: '',
      index: 0,
      isDeleted: false,
    }
  }
}

export default new RulesService()
