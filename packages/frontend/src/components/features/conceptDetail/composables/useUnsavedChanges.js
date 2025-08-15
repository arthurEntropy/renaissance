import { ref } from 'vue'

/**
 * Composable for managing unsaved changes detection and confirmation
 */
export function useUnsavedChanges() {
  const hasUnsavedChanges = ref(false)
  const changeTrackers = ref(new Set())

  const addChangeTracker = (trackerId) => {
    changeTrackers.value.add(trackerId)
  }

  const removeChangeTracker = (trackerId) => {
    changeTrackers.value.delete(trackerId)
    updateUnsavedChangesStatus()
  }

  const markAsChanged = (trackerId) => {
    changeTrackers.value.add(trackerId)
    hasUnsavedChanges.value = true
  }

  const markAsSaved = (trackerId) => {
    changeTrackers.value.delete(trackerId)
    updateUnsavedChangesStatus()
  }

  const updateUnsavedChangesStatus = () => {
    hasUnsavedChanges.value = changeTrackers.value.size > 0
  }

  const confirmIfUnsaved = (action, message = 'You have unsaved changes. Are you sure you want to continue?') => {
    if (hasUnsavedChanges.value) {
      if (confirm(message)) {
        clearAllChanges()
        action()
      }
    } else {
      action()
    }
  }

  const clearAllChanges = () => {
    changeTrackers.value.clear()
    hasUnsavedChanges.value = false
  }

  return {
    hasUnsavedChanges,
    addChangeTracker,
    removeChangeTracker,
    markAsChanged,
    markAsSaved,
    confirmIfUnsaved,
    clearAllChanges
  }
}
