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
