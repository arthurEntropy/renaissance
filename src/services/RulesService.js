import BaseService from './BaseService'

class RulesService extends BaseService {
  constructor() {
    super('http://localhost:3000/rules', 'section')
  }

  // CRUD METHODS
  async createSection() {
    return this.create()
  }

  async getAllSections() {
    return this.getAll()
  }

  async updateSection(section) {
    return this.update(section)
  }

  async deleteSection(section) {
    return this.delete(section)
  }

  // Rules sections are the only entities that have a specific order
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

  getDefaultEntity() {
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
