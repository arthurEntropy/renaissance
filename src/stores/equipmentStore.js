import { defineStore } from 'pinia'
import { reactive, toRefs } from 'vue'
import EquipmentService from '@/services/EquipmentService'
import AncestryService from '@/services/AncestryService'
import CultureService from '@/services/CultureService'
import MestieriService from '@/services/MestiereService'
import WorldElementsService from '@/services/WorldElementService'
import StandardOfLivingService from '@/services/StandardOfLivingService'

export const useEquipmentStore = defineStore('equipment', () => {
  const state = reactive({
    equipment: [],
    sources: {
      ancestries: [],
      cultures: [],
      mestieri: [],
      worldElements: [],
    },
    standardsOfLiving: [],
  })

  const fetchAllEquipment = async () => {
    try {
      state.equipment = await EquipmentService.getAllEquipment()
    } catch (error) {
      console.error('Failed to fetch equipment:', error)
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

  const fetchStandardsOfLiving = async () => {
    try {
      state.standardsOfLiving = await StandardOfLivingService.getAllStandardsOfLiving()
    } catch (error) {
      console.error('Error fetching standards of living:', error)
    }
  }

  const getStandardOfLivingById = (solId) => {
    if (!solId) return null
    return state.standardsOfLiving.find((sol) => sol.id === solId)
  }

  return {
    ...toRefs(state),
    fetchAllEquipment,
    fetchAllSources,
    getSourceById,
    fetchStandardsOfLiving,
    getStandardOfLivingById,
  }
})
