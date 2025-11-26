import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useCrudEntityStore } from './composables/useBaseEntityStore'
import CharacterService from '@/services/entities/characterService'

export const useCharactersStore = defineStore('characters', () => {
  const base = useCrudEntityStore(CharacterService, 'characters')

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

  return {
    characters: base.items,
    selectedCharacter,
    isLoading: base.isLoading,
    error: base.error,
    fetch: base.fetch,
    create: base.create,
    update: base.update,
    remove: base.remove,
    selectCharacter,
    deselectCharacter,
    getById: base.getById,
    filteredCharacters,
    filteredBeasts,
    hasSelectedCharacter,
  }
})
