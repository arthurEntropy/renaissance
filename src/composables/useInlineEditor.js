import { ref, nextTick } from 'vue'

/**
 * Composable for managing inline editing functionality
 * Handles field editing state, validation, and saving
 */
export function useInlineEditor(initialData, updateCallback) {
  const editingField = ref(null)
  const editedData = ref({ ...initialData.value })

  // Template refs object to store field references
  const fieldRefs = ref({})

  const startEditing = (field) => {
    if (editingField.value) {
      saveField(editingField.value)
    }

    // Create a fresh copy of the data before starting to edit
    editedData.value = { ...initialData.value }
    editingField.value = field

    nextTick(() => {
      const fieldRef = fieldRefs.value[field]
      if (fieldRef) {
        fieldRef.focus()
      }
    })
  }

  const saveField = (field) => {
    if (field === editingField.value) {
      editingField.value = null
    }

    const updatedField = editedData.value[field]
    if (updatedField !== initialData.value[field]) {
      const updatedData = {
        ...initialData.value,
        [field]: updatedField,
      }
      updateCallback(updatedData)
    }
  }

  const cancelEditing = () => {
    editingField.value = null
    editedData.value = { ...initialData.value }
  }

  const isEditing = (field) => editingField.value === field

  const setFieldRef = (field, ref) => {
    fieldRefs.value[field] = ref
  }

  // Update edited data when initial data changes (but not while editing)
  const syncData = (newData) => {
    if (!editingField.value) {
      editedData.value = { ...newData }
    }
  }

  return {
    editingField,
    editedData,
    startEditing,
    saveField,
    cancelEditing,
    isEditing,
    setFieldRef,
    syncData
  }
}
