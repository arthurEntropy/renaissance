import { ref } from 'vue'
import { useCharactersStore } from '@/stores/charactersStore'

// Module-level singleton so all callers share the same open/close state
const isOpen = ref(false)
const clearSelectionOnClose = ref(false)

export function useAppCharacterSheetModal() {
  const charactersStore = useCharactersStore()

  const open = (character, { persistSelection = true } = {}) => {
    if (character) {
      charactersStore.selectCharacter(character)
    }
    clearSelectionOnClose.value = !persistSelection
    isOpen.value = true
  }

  const close = () => {
    isOpen.value = false
    if (clearSelectionOnClose.value) {
      charactersStore.deselectCharacter()
      clearSelectionOnClose.value = false
    }
  }

  return {
    isOpen,
    open,
    close,
  }
}
