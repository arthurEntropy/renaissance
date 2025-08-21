import { defineStore } from 'pinia'
import { ref } from 'vue'
import CultureService from '@/services/cultureService.js'

export const useCulturesStore = defineStore('cultures', () => {
  // state
  const cultures = ref([])

  // actions
  const fetch = async () => {
    try {
      cultures.value = await CultureService.getAll()
    } catch (error) {
      console.error('Error fetching cultures:', error)
    }
  }

  // getters
  const getById = (id) => {
    return cultures.value.find(culture => culture.id === id)
  }

  return {
    cultures,
    fetch,
    getById,
  }
})
