import { defineStore } from 'pinia'
import { ref } from 'vue'
import ExpansionService from '@/services/expansionService'

export const useExpansionsStore = defineStore('expansions', () => {
  // state
  const expansions = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // actions
  const fetch = async () => {
    isLoading.value = true
    error.value = null
    try {
      expansions.value = await ExpansionService.getAll()
    } catch (err) {
      console.error('Error fetching expansions:', err)
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  const addExpansion = async (expansion) => {
    try {
      await ExpansionService.addExpansion(expansion)
      await fetch()
    } catch (err) {
      console.error('Error adding expansion:', err)
      error.value = err.message
      throw err
    }
  }

  const deleteExpansion = async (name) => {
    try {
      await ExpansionService.removeExpansion(name)
      await fetch()
    } catch (err) {
      console.error('Error deleting expansion:', err)
      error.value = err.message
      throw err
    }
  }

  const updateExpansion = async (name, updated) => {
    try {
      await ExpansionService.updateExpansion(name, updated)
      await fetch()
    } catch (err) {
      console.error('Error updating expansion:', err)
      error.value = err.message
      throw err
    }
  }

  return {
    // state
    expansions,
    isLoading,
    error,
    // actions
    fetch,
    addExpansion,
    deleteExpansion,
    updateExpansion,
  }
})
