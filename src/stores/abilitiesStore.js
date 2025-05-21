import { defineStore } from 'pinia'
import AbilityService from '@/services/AbilityService'
import AncestryService from '@/services/AncestryService'
import CultureService from '@/services/CultureService'
import MestieriService from '@/services/MestiereService'
import WorldElementsService from '@/services/WorldElementService'

export const useAbilitiesStore = defineStore('abilities', {
  state: () => ({
    abilities: [],
    sources: {
      ancestries: [],
      cultures: [],
      mestieri: [],
      worldElements: [],
    },
    sourcesLoaded: false,
  }),

  actions: {
    async fetchAllAbilities() {
      const abilities = await AbilityService.getAllAbilities()
      this.abilities = abilities
    },

    async fetchAllSources() {
      if (this.sourcesLoaded) return

      try {
        const [ancestries, cultures, mestieri, worldElements] =
          await Promise.all([
            AncestryService.getAllAncestries(),
            CultureService.getAllCultures(),
            MestieriService.getAllMestieri(),
            WorldElementsService.getAllWorldElements(),
          ])

        this.sources = {
          ancestries,
          cultures,
          mestieri,
          worldElements,
        }
        this.sourcesLoaded = true
      } catch (error) {
        console.error('Error fetching sources:', error)
      }
    },

    getSourceById(sourceId) {
      if (!sourceId) return null

      return (
        this.sources.ancestries.find((item) => item.id === sourceId) ||
        this.sources.cultures.find((item) => item.id === sourceId) ||
        this.sources.mestieri.find((item) => item.id === sourceId) ||
        this.sources.worldElements.find((item) => item.id === sourceId)
      )
    },
  },
})
