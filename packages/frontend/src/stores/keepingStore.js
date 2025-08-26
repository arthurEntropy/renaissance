import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import keepingService from '../services/keepingService.js'

export const useKeepingStore = defineStore('keeping', () => {
  // state
  const keeping = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // getters
  const getKeepingById = computed(() => (id) => {
    return keeping.value.find((item) => item.id === id)
  })

  const getKeepingByName = computed(() => (name) => {
    return keeping.value.find((item) => item.name.toLowerCase() === name.toLowerCase())
  })

  // actions
  const fetch = async () => {
    isLoading.value = true
    error.value = null
    try {
      keeping.value = await keepingService.getAll()
    } catch (err) {
      console.error('Error fetching keeping:', err)
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  const createKeeping = async (keepingData) => {
    try {
      const newKeeping = await keepingService.create(keepingData)
      keeping.value.push(newKeeping)
      return newKeeping
    } catch (err) {
      console.error('Error creating keeping:', err)
      error.value = err.message
      throw err
    }
  }

  const updateKeeping = async (id, updates) => {
    try {
      const updatedKeeping = await keepingService.update(id, updates)
      const index = keeping.value.findIndex((item) => item.id === id)
      if (index !== -1) {
        keeping.value[index] = updatedKeeping
      }
      return updatedKeeping
    } catch (err) {
      console.error('Error updating keeping:', err)
      error.value = err.message
      throw err
    }
  }

  const deleteKeeping = async (id) => {
    try {
      await keepingService.delete(id)
      keeping.value = keeping.value.filter((item) => item.id !== id)
    } catch (err) {
      console.error('Error deleting keeping:', err)
      error.value = err.message
      throw err
    }
  }

  return {
    // state
    keeping,
    isLoading,
    error,
    // getters
    getKeepingById,
    getKeepingByName,
    // actions
    fetch,
    createKeeping,
    updateKeeping,
    deleteKeeping,
  }
})
