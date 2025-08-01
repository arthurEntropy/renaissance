import { ref } from 'vue'

export function useEditModal() {
  const showModal = ref(false)
  const itemToEdit = ref(null)

  const openModal = (item) => {
    itemToEdit.value = item
    showModal.value = true
  }

  const closeModal = () => {
    itemToEdit.value = null
    showModal.value = false
  }

  return {
    showModal,
    itemToEdit,
    openModal,
    closeModal
  }
}
