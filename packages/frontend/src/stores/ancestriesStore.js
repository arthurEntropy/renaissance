import { defineStore } from 'pinia'
import { ref } from 'vue'
import AncestryService from '@/services/ancestryService.js'

export const useAncestriesStore = defineStore('ancestries', () => {
  // state
  const ancestries = ref([])

  // actions
  const fetchAncestries = async () => {
    try {
      ancestries.value = await AncestryService.getAll()
    } catch (error) {
      console.error('Error fetching ancestries:', error)
    }
  }

  // getters
  const getAncestryById = (id) => {
    return ancestries.value.find(ancestry => ancestry.id === id)
  }

  return {
    ancestries,
    fetchAncestries,
    getAncestryById,
  }
})
