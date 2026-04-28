import { ref } from 'vue'

// Module-level singleton so both CharacterProfile and CharacterNotes
// share the same open/close state.
const isModalOpen = ref(false)

export function useNotesModal() {
  const openModal = () => {
    isModalOpen.value = true
  }

  const closeModal = () => {
    isModalOpen.value = false
  }

  return { isModalOpen, openModal, closeModal }
}
