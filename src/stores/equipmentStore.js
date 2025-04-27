import { defineStore } from 'pinia';
import EquipmentService from '@/services/EquipmentService';
import AncestryService from '@/services/AncestryService';
import CultureService from '@/services/CultureService';
import MestieriService from '@/services/MestiereService';
import WorldElementsService from '@/services/WorldElementService';
import StandardOfLivingService from '@/services/StandardOfLivingService';

export const useEquipmentStore = defineStore('equipment', {
  state: () => ({
    equipment: [],
    sources: {
      ancestries: [],
      cultures: [],
      mestieri: [],
      worldElements: [],
    },
    standardsOfLiving: [],
    sourcesLoaded: false,
    standardsOfLivingLoaded: false,
    initialized: false,
  }),

  actions: {
    async fetchAllEquipment() {
      const equipment = await EquipmentService.getAllEquipment();
      this.equipment = equipment;
    },

    async fetchAllSources() {
      if (this.sourcesLoaded) return;

      try {
        const [ancestries, cultures, mestieri, worldElements] = await Promise.all([
          AncestryService.getAllAncestries(),
          CultureService.getAllCultures(),
          MestieriService.getAllMestieri(),
          WorldElementsService.getAllWorldElements(),
        ]);

        this.sources = {
          ancestries,
          cultures,
          mestieri,
          worldElements,
        };
        this.sourcesLoaded = true;
      } catch (error) {
        console.error('Error fetching sources:', error);
      }
    },

    async fetchStandardsOfLiving() {
      if (this.standardsOfLivingLoaded) return;

      try {
        const standardsOfLiving = await StandardOfLivingService.getAllStandardsOfLiving();
        this.standardsOfLiving = standardsOfLiving;
        this.standardsOfLivingLoaded = true;
      } catch (error) {
        console.error('Error fetching standards of living:', error);
      }
    },

    getSourceById(sourceId) {
      if (!sourceId) return null;

      return (
        this.sources.ancestries.find(item => item.id === sourceId) ||
        this.sources.cultures.find(item => item.id === sourceId) ||
        this.sources.mestieri.find(item => item.id === sourceId) ||
        this.sources.worldElements.find(item => item.id === sourceId)
      );
    },

    getStandardOfLivingById(solId) {
      if (!solId) return null;
      return this.standardsOfLiving.find(sol => sol.id === solId);
    },

    // Add the missing init method
    async init() {
      if (this.initialized) return;

      try {
        await Promise.all([
          this.fetchAllEquipment(),
          this.fetchAllSources(),
          this.fetchStandardsOfLiving(),
        ]);
        this.initialized = true;
      } catch (error) {
        console.error('Error initializing equipment store:', error);
      }
    },

    updateEquipmentInStore(updatedEquipment) {
      const index = this.equipment.findIndex(e => e.id === updatedEquipment.id);
      if (index !== -1) {
        this.equipment.splice(index, 1, updatedEquipment); // Replace the old equipment with the updated one
      }
    },
  },
});