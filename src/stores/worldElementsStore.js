import { defineStore } from 'pinia';
import { reactive, toRefs } from 'vue';
import WorldElementsService from '@/services/WorldElementService.js';

export const useWorldElementsStore = defineStore('worldElements', () => {
  const state = reactive({
    worldElements: [],
    selectedWorldElement: null,
  });

  const fetchWorldElements = async () => {
    try {
      state.worldElements = await WorldElementsService.getAllWorldElements();
    } catch (error) {
      console.error("Failed to fetch world elements:", error);
    }
  };

  const setSelectedWorldElement = (worldElement) => {
    state.selectedWorldElement = worldElement;
  };

  const clearSelectedWorldElement = () => {
    state.selectedWorldElement = null;
  };

  return {
    ...toRefs(state),
    fetchWorldElements,
    setSelectedWorldElement,
    clearSelectedWorldElement,
  };
});