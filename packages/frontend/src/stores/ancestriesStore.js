import { defineStore } from 'pinia'
import { ref } from 'vue'
import AncestryService from '@/services/ancestryService.js'

export const useAncestriesStore = defineStore('ancestry', () => {
  const ancestries = ref([])

  const fetchAncestries = async () => {
    try {
      ancestries.value = await AncestryService.getAllAncestries()
    } catch (error) {
      console.error('Error fetching ancestries:', error)
    }
  }

  return {
    ancestries,
    fetchAncestries,
  }
})
