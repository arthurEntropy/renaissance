import BaseEntityService from './baseEntityService'
import { createDefaultRulesSection } from '@shared/types'

class RulesService extends BaseEntityService {
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
    return createDefaultRulesSection()
  }
}

export default new RulesService()
