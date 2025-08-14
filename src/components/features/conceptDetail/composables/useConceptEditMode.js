import { ref, computed } from 'vue'

/**
 * Composable for managing concept edit mode and related state
 */
export function useConceptEditMode() {
  const isEditMode = ref(false)
  const hasUnsavedSectionChanges = ref(false)

  const toggleEditMode = (onSave) => {
    if (isEditMode.value && onSave) {
      // Save changes when exiting edit mode
      onSave()
    }
    isEditMode.value = !isEditMode.value
  }

  const setEditMode = (enabled) => {
    isEditMode.value = enabled
  }

  const onSectionUnsavedChanges = (hasChanges) => {
    hasUnsavedSectionChanges.value = hasChanges
  }

  const onSectionResetUnsavedChanges = () => {
    hasUnsavedSectionChanges.value = false
  }

  const hasUnsavedChanges = computed(() => {
    return hasUnsavedSectionChanges.value
  })

  return {
    isEditMode,
    hasUnsavedChanges,
    toggleEditMode,
    setEditMode,
    onSectionUnsavedChanges,
    onSectionResetUnsavedChanges
  }
}
