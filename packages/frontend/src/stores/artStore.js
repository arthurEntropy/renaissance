import { defineStore } from 'pinia'
import { ref } from 'vue'
import ArtService from '@/services/entities/artService'

export const useArtStore = defineStore('art', () => {
  // state
  const art = ref([])

  // Helper function to shuffle array using Fisher-Yates algorithm
  const shuffleArray = (array) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // actions
  const fetch = async () => {
    try {
      const fetchedArt = await ArtService.getAll()
      art.value = shuffleArray(fetchedArt)
    } catch (error) {
      console.error('Error fetching art:', error)
    }
  }

  const updateArt = (updatedArt) => {
    const index = art.value.findIndex(item => item.id === updatedArt.id)
    if (index !== -1) {
      art.value[index] = updatedArt
    }
  }

  const addArt = (newArt) => {
    art.value.push(newArt)
  }

  const removeArt = (artId) => {
    const index = art.value.findIndex(item => item.id === artId)
    if (index !== -1) {
      art.value.splice(index, 1)
    }
  }

  // getters
  const getById = (id) => {
    return art.value.find(item => item.id === id)
  }

  /**
   * Get art URLs filtered by type and source
   * @param {string} type - 'faces' or 'places'
   * @param {string} sourceId - Concept ID
   * @returns {Array} Array of image URLs
   */
  const getByTypeAndSource = (type, sourceId) => {
    return art.value
      .filter(item => 
        item?.tags?.type === type && 
        item?.tags?.sources?.includes(sourceId)
      )
      .map(item => item.url)
  }

  return {
    art,
    fetch,
    updateArt,
    addArt,
    removeArt,
    getById,
    getByTypeAndSource,
  }
})
