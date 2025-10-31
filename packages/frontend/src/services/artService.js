import BaseService from './baseService'

class ArtService extends BaseService {
  constructor() {
    super('/art', 'art')
  }

  getDefaultEntity() {
    return {
      id: null,
      url: '',
      tags: {
        type: 'faces', // 'faces' | 'places'
        sources: [] // array of concept IDs
      },
      isDeleted: false,
    }
  }

  /**
   * Helper method to filter art by type and source
   * @param {Array} allArt - Array of all art items
   * @param {string} type - 'faces' or 'places'
   * @param {string} sourceId - Concept ID
   * @returns {Array} Array of URLs
   */
  getByTypeAndSource(allArt, type, sourceId) {
    return allArt
      .filter(art => 
        art.tags.type === type && 
        art.tags.sources.includes(sourceId)
      )
      .map(art => art.url)
  }
}

export default new ArtService()
