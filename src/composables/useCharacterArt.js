import { ref } from 'vue'
import CharacterService from '@/services/characterService'

/**
 * Composable for managing character art modals and art-related functionality
 * Handles full-size art display and character art changes
 */
export function useCharacterArt() {
  const showFullSizeCharacterArtModal = ref(false)
  const showChangeCharacterArtModal = ref(false)
  const selectedCharacterArtUrl = ref('')
  const tempArtUrl = ref('')
  const defaultArtUrl = ref(CharacterService.DEFAULT_ART_URL)

  const openFullSizeCharacterArtModal = (imageUrl) => {
    selectedCharacterArtUrl.value = imageUrl
    showFullSizeCharacterArtModal.value = true
  }

  const closeFullSizeCharacterArtModal = () => {
    showFullSizeCharacterArtModal.value = false
  }

  const openChangeCharacterArtModal = (character) => {
    tempArtUrl.value = character.artUrls[0] || ''
    showChangeCharacterArtModal.value = true
  }

  const closeChangeCharacterArtModal = () => {
    showChangeCharacterArtModal.value = false
  }

  return {
    showFullSizeCharacterArtModal,
    showChangeCharacterArtModal,
    selectedCharacterArtUrl,
    tempArtUrl,
    defaultArtUrl,
    openFullSizeCharacterArtModal,
    closeFullSizeCharacterArtModal,
    openChangeCharacterArtModal,
    closeChangeCharacterArtModal
  }
}
