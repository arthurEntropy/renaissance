import BaseService from './baseService'

class RulesService extends BaseService {
  constructor() {
    super('/rules', 'section')
  }

  async reorderSections(sections) {
    try {
      const updatePromises = sections.map((section, index) => {
        const updatedSection = { ...section, index }
        return this.update(updatedSection)
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
      id: null,
      name: 'New Section',
      content: '',
      imageUrl: '',
      index: 0,
      isDeleted: false,
    }
  }
}

export default new RulesService()
