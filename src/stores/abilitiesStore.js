import { defineStore } from 'pinia';
import { reactive, toRefs } from 'vue';
import AbilityService from '@/services/AbilityService.js';

export const useAbilitiesStore = defineStore('abilities', () => {
  const state = reactive({
    abilities: [],
    selectedAbility: null,
  });

  const fetchAllAbilities = async () => {
    try {
      state.abilities = await AbilityService.getAllAbilities();
    } catch (error) {
      console.error("Failed to fetch abilities:", error);
    }
  };

  const selectAbility = (ability) => {
    state.selectedAbility = ability;
  };

  const deselectAbility = () => {
    state.selectedAbility = null;
  };

  return {
    ...toRefs(state),
    fetchAllAbilities: fetchAllAbilities,
    selectAbility,
    deselectAbility,
  };
});