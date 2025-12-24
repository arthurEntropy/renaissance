import { ref, computed } from 'vue'

export function useEditModalForm(props, emit) {
  const originalData = ref(JSON.parse(JSON.stringify(props[Object.keys(props)[0]])))
  const editedData = ref(JSON.parse(JSON.stringify(props[Object.keys(props)[0]])))

  const hasChanges = computed(() => {
    return JSON.stringify(originalData.value) !== JSON.stringify(editedData.value)
  })

  const save = () => {
    emit('update', editedData.value)
    emit('close')
  }

  const deleteItem = (itemName = 'this item') => {
    const name = editedData.value.name || itemName
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      emit('delete', editedData.value)
    }
  }

  const close = () => {
    emit('close')
  }

  const handleOverlayClick = () => {
    if (hasChanges.value) {
      if (confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        close()
      }
    } else {
      close()
    }
  }

  return {
    originalData,
    editedData,
    hasChanges,
    save,
    deleteItem,
    close,
    handleOverlayClick
  }
}
