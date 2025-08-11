import { ref } from 'vue'

/**
 * Composable for managing modal state and functionality
 * Handles open/close state, edit mode, and confirmation dialogs
 */
export function useModal(options = {}) {
  const {
    confirmOnClose = false,
    confirmMessage = 'Discard changes?'
  } = options

  const isOpen = ref(false)
  const isEditMode = ref(false)
  const tempContent = ref('')

  const openModal = () => {
    isOpen.value = true
    isEditMode.value = false
  }

  const closeModal = () => {
    if (isEditMode.value && confirmOnClose) {
      if (confirm(confirmMessage)) {
        isOpen.value = false
        isEditMode.value = false
      }
    } else {
      isOpen.value = false
      isEditMode.value = false
    }
  }

  const startEdit = (initialContent = '') => {
    isEditMode.value = true
    tempContent.value = initialContent
  }

  const cancelEdit = () => {
    isEditMode.value = false
    // Return temp content in case it needs to be restored
    return tempContent.value
  }

  const saveEdit = (saveCallback) => {
    if (saveCallback) {
      saveCallback()
    }
    isEditMode.value = false
  }

  return {
    isOpen,
    isEditMode,
    tempContent,
    openModal,
    closeModal,
    startEdit,
    cancelEdit,
    saveEdit
  }
}
