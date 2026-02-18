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

  // Actions
  const selectCharacter = (character) => {
    selectedCharacter.value = character
  }

  const deselectCharacter = () => {
    selectedCharacter.value = null
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
    return updatedEntity
  }

  return {
    characters: base.items,
    selectedCharacter,
    isLoading: base.isLoading,
    error: base.error,
    fetch: base.fetch,
    create: base.create,
    update,
    remove: base.remove,
    selectCharacter,
    deselectCharacter,
    getById: base.getById,
    filteredCharacters,
    filteredBeasts,
    hasSelectedCharacter,
    canEditSelectedCharacter,
  }
})
