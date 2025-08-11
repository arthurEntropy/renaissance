import { defineStore } from 'pinia'
import { ref } from 'vue'
import AbilityService from '@/services/AbilityService'
import AncestryService from '@/services/AncestryService'
import CultureService from '@/services/CultureService'
import MestieriService from '@/services/MestiereService'
import WorldElementsService from '@/services/WorldElementService'

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
