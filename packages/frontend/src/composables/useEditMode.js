import { ref } from 'vue'

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

// For components that don't need data backup/restore functionality
export function useSimpleEditMode(options = {}) {
  const {
    onEnterEdit = () => {},
    onExitEdit = () => {}
  } = options

  const isEditMode = ref(false)

  const toggleEditMode = () => {
    const wasEditMode = isEditMode.value
    isEditMode.value = !isEditMode.value

    if (isEditMode.value && !wasEditMode) {
      onEnterEdit()
    } else if (!isEditMode.value && wasEditMode) {
      onExitEdit()
    }
  }

  const setEditMode = (value) => {
    const wasEditMode = isEditMode.value
    isEditMode.value = value

    if (isEditMode.value && !wasEditMode) {
      onEnterEdit()
    } else if (!isEditMode.value && wasEditMode) {
      onExitEdit()
    }
  }

  const exitEditMode = () => {
    if (isEditMode.value) {
      isEditMode.value = false
      onExitEdit()
    }
  }

  const enterEditMode = () => {
    if (!isEditMode.value) {
      isEditMode.value = true
      onEnterEdit()
    }
  }

  return {
    isEditMode,
    toggleEditMode,
    setEditMode,
    exitEditMode,
    enterEditMode
  }
}
