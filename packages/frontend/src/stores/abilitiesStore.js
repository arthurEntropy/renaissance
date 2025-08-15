import { defineStore } from 'pinia'
import { ref } from 'vue'
import AbilityService from '@/services/abilityService'
import AncestryService from '@/services/ancestryService'
import CultureService from '@/services/cultureService'
import MestieriService from '@/services/mestiereService'
import WorldElementsService from '@/services/worldElementService'

export const useAbilitiesStore = defineStore('abilities', () => {
  // state
  const abilities = ref([])
  const sources = ref({
    ancestries: [],
    cultures: [],
    mestieri: [],
    worldElements: [],
  })

  // actions
  const fetchAllAbilities = async () => {
    try {
      abilities.value = await AbilityService.getAllAbilities()
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

      sources.value = {
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
      sources.value.ancestries.find((item) => item.id === sourceId) ||
      sources.value.cultures.find((item) => item.id === sourceId) ||
      sources.value.mestieri.find((item) => item.id === sourceId) ||
      sources.value.worldElements.find((item) => item.id === sourceId)
    )
  }

  return {
    abilities,
    sources,
    fetchAllAbilities,
    fetchAllSources,
    getSourceById,
  }
})
