import { defineStore } from 'pinia'
import { ref } from 'vue'
import WorldElementsService from '@/services/worldElementService.js'

export const useWorldElementsStore = defineStore('worldElements', () => {
  const worldElements = ref([])

  const fetchWorldElements = async () => {
    try {
      worldElements.value = await WorldElementsService.getAllWorldElements()
    } catch (error) {
      console.error('Failed to fetch world elements:', error)
    }
  }

  return {
    worldElements,
    fetchWorldElements,
  }
})
