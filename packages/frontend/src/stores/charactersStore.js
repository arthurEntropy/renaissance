import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import CharacterService from '@/services/characterService'

export const useCharactersStore = defineStore('characters', () => {
  // state
  const characters = ref([])
  const selectedCharacter = ref(null)

  // actions
  const fetch = async () => {
    try {
      characters.value = await CharacterService.getAll()
    } catch (error) {
      console.error('Error fetching characters:', error)
    }
  }

  const selectCharacter = (character) => {
    selectedCharacter.value = character
  }

  const deselectCharacter = () => {
    selectedCharacter.value = null
  }

  // getters
  const getById = (id) => {
    return characters.value.find(character => character.id === id)
  }

  const filteredCharacters = computed(() => {
    return characters.value.filter(character => !character.isDeleted)
  })

  // Check if there's a selected character
  const hasSelectedCharacter = computed(() => {
    return selectedCharacter.value !== null
  })

  return {
    characters,
    selectedCharacter,
    fetch,
    selectCharacter,
    deselectCharacter,
    getById,
    filteredCharacters,
    hasSelectedCharacter,
  }
})
