import { defineStore } from 'pinia'
import { ref } from 'vue'
import WorldElementsService from '@/services/worldElementService.js'

export const useWorldElementsStore = defineStore('worldElements', () => {
  // state
  const worldElements = ref([])

  // actions
  const fetch = async () => {
    try {
      worldElements.value = await WorldElementsService.getAll()
    } catch (error) {
      console.error('Error fetching world elements:', error)
    }
  }

  // getters
  const getById = (id) => {
    return worldElements.value.find(worldElement => worldElement.id === id)
  }

  return {
    worldElements,
    fetch,
    getById,
  }
})
