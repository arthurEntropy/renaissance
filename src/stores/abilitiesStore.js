import { defineStore } from 'pinia'
import { reactive, toRefs } from 'vue'
import AbilityService from '@/services/AbilityService'
import AncestryService from '@/services/AncestryService'
import CultureService from '@/services/CultureService'
import MestieriService from '@/services/MestiereService'
import WorldElementsService from '@/services/WorldElementService'

export const useAbilitiesStore = defineStore('abilities', () => {
  const state = reactive({
    abilities: [],
    sources: {
      ancestries: [],
      cultures: [],
      mestieri: [],
      worldElements: [],
    },
  })

  const fetchAllAbilities = async () => {
    try {
      state.abilities = await AbilityService.getAllAbilities()
    } catch (error) {
      console.error('Failed to fetch abilities:', error)
    }
  }

  const fetchAllSources = async () => {
    try {
      const [ancestries, cultures, mestieri, worldElements] = await Promise.all([
        AncestryService.getAllAncestries(),
        CultureService.getAllCultures(),
        MestieriService.getAllMestieri(),
        WorldElementsService.getAllWorldElements(),
      ])

      state.sources = {
        ancestries,
        cultures,
        mestieri,
        worldElements,
      }
    } catch (error) {
      console.error('Error fetching sources:', error)
    }
  }

  const getSourceById = (sourceId) => {
    if (!sourceId) return null

    return (
      state.sources.ancestries.find((item) => item.id === sourceId) ||
      state.sources.cultures.find((item) => item.id === sourceId) ||
      state.sources.mestieri.find((item) => item.id === sourceId) ||
      state.sources.worldElements.find((item) => item.id === sourceId)
    )
  }

  return {
    ...toRefs(state),
    fetchAllAbilities,
    fetchAllSources,
    getSourceById,
  }
})
