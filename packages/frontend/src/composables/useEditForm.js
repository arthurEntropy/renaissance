import { ref, computed } from 'vue'

/**
 * Composable for managing edit forms within modals
 * Provides common patterns for editing entities with save/delete/cancel operations
 */
export function useEditForm(initialData, emit) {
  // Reactive state - initialize immediately with props
  const originalData = ref(JSON.parse(JSON.stringify(initialData)))
  const editedData = ref(JSON.parse(JSON.stringify(initialData)))

  // Computed property to ensure we have valid data
  const safeData = computed(() => {
    return editedData.value || {}
  })

  // Common form actions
  const save = (additionalProcessing = null) => {
    if (additionalProcessing) {
      additionalProcessing()
    }
    emit('update', editedData.value)
    emit('close')
  }

  const deleteItem = (itemType = 'item') => {
    const name = editedData.value.name || `this ${itemType}`
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      emit('delete', editedData.value)
    }
  }

  const cancel = () => {
    emit('close')
  }

  // Check if data has been modified
  const hasChanges = computed(() => {
    return JSON.stringify(originalData.value) !== JSON.stringify(editedData.value)
  })

  return {
    originalData,
    editedData,
    safeData,
    save,
    deleteItem,
    cancel,
    hasChanges
  }
}
