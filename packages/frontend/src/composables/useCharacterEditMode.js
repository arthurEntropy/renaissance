import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'

/**
 * Composable for managing character sheet edit mode
 * Similar to useConceptEditMode but with character-specific logic
 * 
 * Edit permissions:
 * - Admins can edit all characters and beasts
 * - Regular users can edit their own characters (not beasts)
 * - Unauthenticated users cannot edit anything
 */
export function useCharacterEditMode(character) {
  const authStore = useAuthStore()
  const isEditMode = ref(false)

  /**
   * Determines if the current user can edit this character
   */
  const canEdit = computed(() => {
    if (!character?.value) return false
    
    // Admins can edit everything
    if (authStore.isAdmin) return true
    
    // Beasts can only be edited by admins
    if (character.value.isBeast) return false
    
    // For regular characters, check ownership
    // TODO: Add ownerId field to character schema and check it here
    // For now, authenticated users can edit non-beasts
    return authStore.isAuthenticated
  })

  /**
   * Toggles edit mode on/off
   * Optionally executes a save callback when toggling off
   */
  const toggleEditMode = (saveCallback) => {
    if (!canEdit.value) return
    
    if (isEditMode.value && saveCallback) {
      saveCallback()
    }
    
    isEditMode.value = !isEditMode.value
  }

  /**
   * Force enable edit mode (if user has permission)
   */
  const enableEditMode = () => {
    if (canEdit.value) {
      isEditMode.value = true
    }
  }

  /**
   * Force disable edit mode
   */
  const disableEditMode = () => {
    isEditMode.value = false
  }

  return {
    isEditMode,
    canEdit,
    toggleEditMode,
    enableEditMode,
    disableEditMode
  }
}
