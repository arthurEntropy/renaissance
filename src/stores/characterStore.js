import { defineStore } from 'pinia';
import { reactive, toRefs } from 'vue';
import CharacterService from '@/services/CharacterService';

export const useCharacterStore = defineStore('character', () => {
  const state = reactive({
    characters: [],
    selectedCharacter: null,
  });

  const fetchCharacters = async () => {
    try {
      state.characters = await CharacterService.getAllCharacters();
      if (state.characters.length > 0) {
        state.selectedCharacter = state.characters[0]; // Default to first character
      }
    } catch (error) {
      console.error("Failed to fetch characters:", error);
    }
  };

  return {
    ...toRefs(state),
    fetchCharacters,
  };
});
