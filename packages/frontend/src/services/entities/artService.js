import BaseEntityService from './baseEntityService'

class ArtService extends BaseEntityService {
  constructor() {
    super('/art', 'art')
  }

  getDefaultEntity() {
    const now = new Date().toISOString()
    return {
      id: null,
      url: '',
      tags: {
        type: 'faces',
        sources: []
      },
      isDeleted: false,
      createdAt: now,
      lastModified: now,
    }
  }

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
