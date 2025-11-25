import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import UserService from '@/services/entities/userService'
import { useBackgroundImagesStore } from './backgroundImagesStore'

export const useUserPreferencesStore = defineStore('userPreferences', () => {
  // state
  const userProfile = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  // Fallback background image URL (used if no default is found in store)
  const FALLBACK_BACKGROUND = 'https://cdn.midjourney.com/b380594a-e352-4deb-b7b0-c3fff0095472/0_3.png'

  // computed
  const preferences = computed(() => userProfile.value?.preferences || {})
  
  const selectedBackgroundImage = computed(() => {
    const backgroundImageId = preferences.value?.backgroundImageId
    const backgroundImagesStore = useBackgroundImagesStore()
    
    if (!backgroundImageId) {
      // Find the default background
      const defaultBg = backgroundImagesStore.backgroundImages.find(img => img.isDefault)
      return defaultBg?.imageUrl || FALLBACK_BACKGROUND
    }
    
    const selectedImage = backgroundImagesStore.backgroundImages.find(
      img => img.id === backgroundImageId
    )
    
    // If selected image not found, fall back to default
    if (!selectedImage) {
      const defaultBg = backgroundImagesStore.backgroundImages.find(img => img.isDefault)
      return defaultBg?.imageUrl || FALLBACK_BACKGROUND
    }
    
    return selectedImage.imageUrl
  })

  // actions
  const fetchPreferences = async () => {
    isLoading.value = true
    error.value = null
    try {
      const profile = await UserService.getCurrentProfile()
      userProfile.value = profile
    } catch (err) {
      console.error('Error fetching user profile:', err)
      error.value = err.message
      // Set default preferences if none exist
      userProfile.value = {
        preferences: {}
      }
    } finally {
      isLoading.value = false
    }
  }

  const updatePreferences = async (newPreferences) => {
    try {
      const updatedProfile = await UserService.updateCurrentProfile({
        preferences: {
          ...preferences.value,
          ...newPreferences
        }
      })
      userProfile.value = updatedProfile
    } catch (err) {
      console.error('Error updating user preferences:', err)
      error.value = err.message
      throw err
    }
  }

  const setBackgroundImage = async (backgroundImageId) => {
    await updatePreferences({ backgroundImageId })
  }

  return {
    // state
    userProfile,
    isLoading,
    error,
    // computed
    preferences,
    selectedBackgroundImage,
    // actions
    fetchPreferences,
    updatePreferences,
    setBackgroundImage,
  }
})
