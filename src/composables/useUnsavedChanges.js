import { ref, watch } from 'vue'
import { useEditMode } from './useEditMode'

/**
 * Composable for tracking unsaved changes and emitting appropriate events
 * @param {Function} emit - The emit function from the component
 * @param {Function} hasChanges - Function that returns boolean indicating if there are changes
 * @returns {Object} Unsaved changes utilities
 */
export function useUnsavedChanges(emit, hasChanges) {
  const hasUnsavedChanges = ref(false)

  const markAsChanged = () => {
    if (!hasUnsavedChanges.value) {
      hasUnsavedChanges.value = true
      emit('unsaved-changes')
    }
  }

  const markAsSaved = () => {
    if (hasUnsavedChanges.value) {
      hasUnsavedChanges.value = false
      emit('reset-unsaved-changes')
    }
  }

  const checkForChanges = () => {
    const currentlyHasChanges = hasChanges()
    
    if (currentlyHasChanges && !hasUnsavedChanges.value) {
      markAsChanged()
    } else if (!currentlyHasChanges && hasUnsavedChanges.value) {
      markAsSaved()
    }
  }

  return {
    hasUnsavedChanges,
    markAsChanged,
    markAsSaved,
    checkForChanges
  }
}

/**
 * Composable that combines edit mode with unsaved changes tracking
 * @param {Function} emit - The emit function from the component
 * @param {Function} onUpdate - Callback when data should be updated
 * @returns {Object} Combined edit mode and unsaved changes utilities
 */
export function useEditWithUnsavedChanges(emit, onUpdate = () => {}) {
  const editMode = useEditMode({
    onSave: (data) => {
      onUpdate(data)
      unsavedChanges.markAsSaved()
    },
    onCancel: () => {
      unsavedChanges.markAsSaved()
    },
    onStartEdit: () => {
      unsavedChanges.markAsChanged()
    }
  })

  const unsavedChanges = useUnsavedChanges(emit, () => {
    // Only check for unsaved changes when in edit mode
    return editMode.isEditing.value && editMode.hasUnsavedChanges
  })

  // Watch for changes in edit mode data
  const watchForChanges = (dataRef) => {
    watch(dataRef, () => {
      if (editMode.isEditing.value) {
        unsavedChanges.checkForChanges()
      }
    }, { deep: true })
  }

  return {
    ...editMode,
    ...unsavedChanges,
    watchForChanges
  }
}

// Re-export useEditMode for convenience
export { useEditMode } from './useEditMode.js'
