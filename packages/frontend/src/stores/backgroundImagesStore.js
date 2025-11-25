import { defineStore } from 'pinia'
import { ref } from 'vue'
import BackgroundImageService from '@/services/entities/backgroundImageService'

export const useBackgroundImagesStore = defineStore('backgroundImages', () => {
  // state
  const backgroundImages = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // actions
  const fetch = async () => {
    isLoading.value = true
    error.value = null
    try {
      backgroundImages.value = await BackgroundImageService.getAll()
      // Filter out deleted images
      backgroundImages.value = backgroundImages.value.filter(img => !img.isDeleted)
    } catch (err) {
      console.error('Error fetching background images:', err)
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  const addBackgroundImage = async (image) => {
    try {
      await BackgroundImageService.create(image)
      await fetch()
    } catch (err) {
      console.error('Error adding background image:', err)
      error.value = err.message
      throw err
    }
  }

  const updateBackgroundImage = async (image) => {
    try {
      await BackgroundImageService.update(image)
      await fetch()
    } catch (err) {
      console.error('Error updating background image:', err)
      error.value = err.message
      throw err
    }
  }

  const deleteBackgroundImage = async (image) => {
    try {
      await BackgroundImageService.delete(image)
      await fetch()
    } catch (err) {
      console.error('Error deleting background image:', err)
      error.value = err.message
      throw err
    }
  }

  return {
    // state
    backgroundImages,
    isLoading,
    error,
    // actions
    fetch,
    addBackgroundImage,
    updateBackgroundImage,
    deleteBackgroundImage,
  }
})
