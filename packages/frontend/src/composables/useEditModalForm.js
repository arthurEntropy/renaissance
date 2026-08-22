import { ref, computed } from 'vue'
import { useConfirm } from './useConfirm'

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

  const deleteItem = async (itemName = 'this item') => {
    const { confirm } = useConfirm()
    const name = editedData.value.name || itemName
    if (await confirm(`Are you sure you want to delete "${name}"?`)) {
      emit('delete', editedData.value)
    }
  }

  const close = () => {
    emit('close')
  }

  const handleOverlayClick = async () => {
    const { confirm } = useConfirm()
    if (hasChanges.value) {
      if (await confirm('You have unsaved changes. Are you sure you want to discard them?')) {
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
