import { defineStore } from 'pinia'
import { ref } from 'vue'
import CharacterService from '@/services/CharacterService'

export const useCharactersStore = defineStore('characters', () => {
  const characters = ref([])

  const fetchCharacters = async () => {
    try {
      characters.value = await CharacterService.getAllCharacters()
    } catch (error) {
      console.error('Failed to fetch characters:', error)
    }
  }

  return {
    characters,
    fetchCharacters,
  }
})
