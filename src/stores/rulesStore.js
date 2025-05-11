import { defineStore } from 'pinia';
import { reactive, toRefs } from 'vue';
import RulesService from '@/services/RulesService.js';

export const useRulesStore = defineStore('rules', () => {
  const state = reactive({
    sections: [],
    currentSection: null
  });

  const fetchRules = async () => {
    try {
      const allSections = await RulesService.getAllSections();
      // Filter out deleted sections
      state.sections = allSections.filter(section => !section.isDeleted);
    } catch (error) {
      console.error("Error fetching sections:", error);
    }
  };

  const setCurrentSection = (sectionId) => {
    state.currentSection = state.sections.find(section => section.id === sectionId) || null;
  };

  return {
    ...toRefs(state),
    fetchRules,
    setCurrentSection
  };
});