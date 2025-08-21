import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import standardOfLivingService from '../services/standardOfLivingService.js'

export const useStandardsOfLivingStore = defineStore('standardsOfLiving', () => {
  // state
  const standardsOfLiving = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // getters
  const getStandardOfLivingById = computed(() => (id) => {
    return standardsOfLiving.value.find((item) => item.id === id)
  })

  const getStandardOfLivingByName = computed(() => (name) => {
    return standardsOfLiving.value.find((item) => item.name.toLowerCase() === name.toLowerCase())
  })

  // actions
  const fetch = async () => {
    isLoading.value = true
    error.value = null
    try {
      standardsOfLiving.value = await standardOfLivingService.getAll()
    } catch (err) {
      console.error('Error fetching standards of living:', err)
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  const createStandardOfLiving = async (standardOfLiving) => {
    try {
      const newStandardOfLiving = await standardOfLivingService.create(standardOfLiving)
      standardsOfLiving.value.push(newStandardOfLiving)
      return newStandardOfLiving
    } catch (err) {
      console.error('Error creating standard of living:', err)
      error.value = err.message
      throw err
    }
  }

  const updateStandardOfLiving = async (id, updates) => {
    try {
      const updatedStandardOfLiving = await standardOfLivingService.update(id, updates)
      const index = standardsOfLiving.value.findIndex((item) => item.id === id)
      if (index !== -1) {
        standardsOfLiving.value[index] = updatedStandardOfLiving
      }
      return updatedStandardOfLiving
    } catch (err) {
      console.error('Error updating standard of living:', err)
      error.value = err.message
      throw err
    }
  }

  const deleteStandardOfLiving = async (id) => {
    try {
      await standardOfLivingService.delete(id)
      standardsOfLiving.value = standardsOfLiving.value.filter((item) => item.id !== id)
    } catch (err) {
      console.error('Error deleting standard of living:', err)
      error.value = err.message
      throw err
    }
  }

  return {
    // state
    standardsOfLiving,
    isLoading,
    error,
    // getters
    getStandardOfLivingById,
    getStandardOfLivingByName,
    // actions
    fetch,
    createStandardOfLiving,
    updateStandardOfLiving,
    deleteStandardOfLiving,
  }
})
