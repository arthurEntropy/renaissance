import { defineStore } from 'pinia'
import { ref } from 'vue'
import CharacterService from '@/services/characterService'

export const useCharactersStore = defineStore('characters', () => {
  const characters = ref([])

  const fetchCharacters = async () => {
    try {
      characters.value = await CharacterService.getAllCharacters()
    } catch (error) {
      console.error('Error fetching characters:', error)
    }
  }

  return {
    characters,
    fetchCharacters,
  }
})
