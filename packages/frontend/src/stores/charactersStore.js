import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useCrudEntityStore } from './composables/useBaseEntityStore'
import CharacterService from '@/services/entities/characterService'
import { useAuthStore } from './authStore'

export const useCharactersStore = defineStore('characters', () => {
  const base = useCrudEntityStore(CharacterService, 'characters')
  const authStore = useAuthStore()

  // Additional state for app-wide selected character feature
  const selectedCharacter = ref(null)
  const isAddToCharacterHovering = ref(false)

  // Actions
  const selectCharacter = (character) => {
    selectedCharacter.value = character
  }

  const deselectCharacter = () => {
    selectedCharacter.value = null
  }

  const setAddToCharacterHovering = (isHovering) => {
    isAddToCharacterHovering.value = isHovering
  }

  // Computed properties
  const filteredCharacters = computed(() => {
    return base.items.value.filter(character => !character.isBeast)
  })

  const filteredBeasts = computed(() => {
    return base.items.value.filter(character => character.isBeast)
  })

  const hasSelectedCharacter = computed(() => {
    return selectedCharacter.value !== null
  })

  const canEditSelectedCharacter = computed(() => {
    if (!selectedCharacter.value) return false
    if (authStore.isAdmin) return true
    if (selectedCharacter.value.isBeast) return false
    if (!authStore.isAuthenticated) return false
    return selectedCharacter.value.userId === authStore.user?.uid
  })

  // Wrap update to sync selectedCharacter
  const update = async (entity) => {
    const updatedEntity = await base.update(entity)
    // If the updated entity is the currently selected character, update the reference
    if (selectedCharacter.value && selectedCharacter.value.id === updatedEntity.id) {
      selectedCharacter.value = updatedEntity
    }
    return updatedEntity
  }

  return {
    characters: base.items,
    selectedCharacter,
    isAddToCharacterHovering,
    isLoading: base.isLoading,
    error: base.error,
    fetch: base.fetch,
    create: base.create,
    update,
    remove: base.remove,
    selectCharacter,
    deselectCharacter,
    setAddToCharacterHovering,
    getById: base.getById,
    filteredCharacters,
    filteredBeasts,
    hasSelectedCharacter,
    canEditSelectedCharacter,
  }
})
