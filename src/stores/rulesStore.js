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
      state.sections = await RulesService.getAllSections();
    } catch (error) {
      console.error("Error fetching sections:", error);
    }
  };

  const fetchSection = async (id) => {
    try {
      state.currentSection = await RulesService.fetchSection(id);
      return state.currentSection;
    } catch (error) {
      console.error(`Error fetching section ${id}:`, error);
    }
  };

  const updateSection = async (section) => {
    try {
      await RulesService.updateSection(section);
      // Update the section in the sections array
      const index = state.sections.findIndex(s => s.id === section.id);
      if (index !== -1) {
        state.sections[index] = { ...section };
      }
      return section;
    } catch (error) {
      console.error("Error updating section:", error);
    }
  };

  const createSection = async (sectionData) => {
    try {
      const newSection = await RulesService.createSection(sectionData);
      state.sections.push(newSection);
      return newSection;
    } catch (error) {
      console.error("Error creating section:", error);
    }
  };

  const deleteSection = async (id) => {
    try {
      await RulesService.deleteSection(id);
      state.sections = state.sections.filter(section => section.id !== id);
    } catch (error) {
      console.error("Error deleting section:", error);
    }
  };

  const reorderSections = async (orderedIds) => {
    try {
      await RulesService.reorderSections(orderedIds);
      // Re-fetch all rules to get the updated order
      await fetchRules();
    } catch (error) {
      console.error("Error reordering sections:", error);
    }
  };

  return {
    ...toRefs(state),
    fetchRules,
    fetchSection,
    updateSection,
    createSection,
    deleteSection,
    reorderSections
  };
});