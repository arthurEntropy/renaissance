import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useFetchCharacters } from '../services/characterService';

export const useCharacterStore = defineStore('character', () => {
  const characters = ref([]);
  const selectedCharacter = ref(null);

  const fetchCharacters = async () => {
    try {
      characters.value = await useFetchCharacters();
      if (characters.value.length > 0) {
        selectedCharacter.value = characters.value[0]; // Default to first character
      }
    } catch (error) {
      console.error("Failed to fetch characters:", error);
    }
  };

  return {
    characters,
    selectedCharacter,
    fetchCharacters,
  };
});
