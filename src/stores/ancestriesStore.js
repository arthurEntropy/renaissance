import { defineStore } from 'pinia'
import { reactive, toRefs } from 'vue'
import AncestryService from '@/services/AncestryService.js'

export const useAncestriesStore = defineStore('ancestry', () => {
  const state = reactive({
    ancestries: [],
    selectedAncestry: null,
  })

  const fetchAncestries = async () => {
    try {
      state.ancestries = await AncestryService.getAllAncestries()
    } catch (error) {
      console.error('Failed to fetch ancestries:', error)
    }
  }

  return {
    ...toRefs(state),
    fetchAncestries: fetchAncestries,
  }
})
