import { ref } from 'vue'

/**
 * Composable for managing edit mode state with backup/restore functionality
 * @param {Object} options - Configuration options
 * @param {Function} options.onSave - Callback when saving changes
 * @param {Function} options.onCancel - Callback when canceling changes
 * @param {Function} options.onStartEdit - Callback when starting edit mode
 * @returns {Object} Edit mode utilities
 */
export function useEditMode(options = {}) {
  const { onSave = () => {}, onCancel = () => {}, onStartEdit = () => {} } = options
  
  const isEditing = ref(false)
  const backupData = ref(null)

  const startEdit = (currentData) => {
    if (isEditing.value) return
    
    // Create backup of current state
    backupData.value = JSON.parse(JSON.stringify(currentData))
    isEditing.value = true
    onStartEdit()
  }

  const saveEdit = (localData) => {
    if (!isEditing.value) return
    
    isEditing.value = false
    onSave(localData)
    backupData.value = null
  }

  const cancelEdit = () => {
    if (!isEditing.value) return
    
    const restored = backupData.value ? JSON.parse(JSON.stringify(backupData.value)) : null
    isEditing.value = false
    onCancel(restored)
    backupData.value = null
    return restored
  }

  const hasUnsavedChanges = (currentData) => {
    if (!isEditing.value || !backupData.value) return false
    return JSON.stringify(currentData) !== JSON.stringify(backupData.value)
  }

  return {
    isEditing,
    startEdit,
    saveEdit,
    cancelEdit,
    hasUnsavedChanges
  }
}

/**
 * Simple edit mode for basic toggle functionality
 * Use this for simpler components that don't need backup/restore
 */
export function useSimpleEditMode() {
  const isEditMode = ref(false)

  const toggleEditMode = () => {
    isEditMode.value = !isEditMode.value
  }

  const setEditMode = (value) => {
    isEditMode.value = value
  }

  const exitEditMode = () => {
    isEditMode.value = false
  }

  const enterEditMode = () => {
    isEditMode.value = true
  }

  return {
    isEditMode,
    toggleEditMode,
    setEditMode,
    exitEditMode,
    enterEditMode
  }
}
