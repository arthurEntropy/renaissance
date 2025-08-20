import { defineStore } from 'pinia'
import { ref } from 'vue'
import CharacterService from '@/services/characterService'

export const useCharactersStore = defineStore('characters', () => {
  // state
  const characters = ref([])

  // actions
  const fetchCharacters = async () => {
    try {
      characters.value = await CharacterService.getAll()
    } catch (error) {
      console.error('Error fetching characters:', error)
    }
  }

  // getters
  const getCharacterById = (id) => {
    return characters.value.find(character => character.id === id)
  }

  return {
    characters,
    fetchCharacters,
    getCharacterById,
  }
})
