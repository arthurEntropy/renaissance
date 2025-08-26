import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import CharacterService from '@/services/characterService'

export const useCharactersStore = defineStore('characters', () => {
  // state
  const characters = ref([])

  // actions
  const fetch = async () => {
    try {
      characters.value = await CharacterService.getAll()
    } catch (error) {
      console.error('Error fetching characters:', error)
    }
  }

  // getters
  const getById = (id) => {
    return characters.value.find(character => character.id === id)
  }

  const filteredCharacters = computed(() => {
    return characters.value.filter(character => !character.isDeleted)
  })

  return {
    characters,
    fetch,
    getById,
    filteredCharacters,
  }
})
