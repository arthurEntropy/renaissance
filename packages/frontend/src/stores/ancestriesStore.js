import { defineStore } from 'pinia'
import { ref } from 'vue'
import AncestryService from '@/services/ancestryService.js'

export const useAncestriesStore = defineStore('ancestries', () => {
  // state
  const ancestries = ref([])

  // actions
  const fetch = async () => {
    try {
      ancestries.value = await AncestryService.getAll()
    } catch (error) {
      console.error('Error fetching ancestries:', error)
    }
  }

  // getters
  const getById = (id) => {
    return ancestries.value.find(ancestry => ancestry.id === id)
  }

  return {
    ancestries,
    fetch,
    getById,
  }
})
