import { defineStore } from 'pinia'
import { ref } from 'vue'
import CultureService from '@/services/cultureService.js'

export const useCulturesStore = defineStore('culture', () => {
  const cultures = ref([])

  const fetchCultures = async () => {
    try {
      cultures.value = await CultureService.getAllCultures()
    } catch (error) {
      console.error('Failed to fetch cultures:', error)
    }
  }

  return {
    cultures,
    fetchCultures,
  }
})
