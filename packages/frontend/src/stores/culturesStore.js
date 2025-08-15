import { defineStore } from 'pinia'
import { ref } from 'vue'
import CultureService from '@/services/cultureService.js'

export const useCulturesStore = defineStore('culture', () => {
  const cultures = ref([])

  const fetchCultures = async () => {
    try {
      cultures.value = await CultureService.getAllCultures()
    } catch (error) {
      console.error('Error fetching cultures:', error)
    }
  }

  return {
    cultures,
    fetchCultures,
  }
})
