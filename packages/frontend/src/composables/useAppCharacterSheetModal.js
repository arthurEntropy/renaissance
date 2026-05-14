import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCharactersStore } from '@/stores/charactersStore'
import { createSlug } from '@/utils/urlHelpers'
import { isBeastTemplate, isBeastInstance } from '@/utils/characterTypeGuards'

// Module-level singleton for clearSelectionOnClose
const clearSelectionOnClose = ref(false)

export function useAppCharacterSheetModal() {
  const charactersStore = useCharactersStore()
  const router = useRouter()
  const route = useRoute()

  // isOpen is derived entirely from the route — no separate state to sync.
  const isOpen = computed(() =>
    route.path.startsWith('/characters/') || route.path.startsWith('/bestiary/')
  )

  const open = (character, { persistSelection = true } = {}) => {
    if (character) {
      charactersStore.selectCharacter(character)
      const isBeast = isBeastTemplate(character) || isBeastInstance(character)
      const basePath = isBeast ? '/bestiary' : '/characters'
      router.push(`${basePath}/${createSlug(character.name)}`)
    }
    clearSelectionOnClose.value = !persistSelection
  }

  const close = () => {
    if (clearSelectionOnClose.value) {
      charactersStore.deselectCharacter()
      clearSelectionOnClose.value = false
    }
    // Navigate back to the list if we're on a character or beast detail URL
    if (route.path.startsWith('/characters/')) {
      router.push('/characters')
    } else if (route.path.startsWith('/bestiary/')) {
      router.push('/bestiary')
    }
  }

  return {
    isOpen,
    open,
    close,
  }
}
