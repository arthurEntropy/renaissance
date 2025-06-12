import { defineStore } from 'pinia'
import { reactive, toRefs } from 'vue'
import CultureService from '@/services/CultureService.js'

export const useCulturesStore = defineStore('culture', () => {
  const state = reactive({
    cultures: [],
  })

  const fetchCultures = async () => {
    try {
      state.cultures = await CultureService.getAllCultures()
    } catch (error) {
      console.error('Failed to fetch cultures:', error)
    }
  }

  return {
    ...toRefs(state),
    fetchCultures: fetchCultures,
  }
})
