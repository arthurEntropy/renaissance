import { defineStore } from 'pinia'
import { ref } from 'vue'
import EquipmentService from '@/services/equipmentService'
import AncestryService from '@/services/ancestryService'
import CultureService from '@/services/cultureService'
import MestieriService from '@/services/mestiereService'
import WorldElementsService from '@/services/worldElementService'
import StandardOfLivingService from '@/services/standardOfLivingService'

export const useEquipmentStore = defineStore('equipment', () => {
  const equipment = ref([])
  const sources = ref({
    ancestries: [],
    cultures: [],
    mestieri: [],
    worldElements: [],
  })
  const standardsOfLiving = ref([])

  const fetchAllEquipment = async () => {
    try {
      equipment.value = await EquipmentService.getAllEquipment()
    } catch (error) {
      console.error('Error fetching equipment:', error)
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

  const fetchStandardsOfLiving = async () => {
    try {
      standardsOfLiving.value = await StandardOfLivingService.getAllStandardsOfLiving()
    } catch (error) {
      console.error('Error fetching standards of living:', error)
    }
  }

  const getStandardOfLivingById = (solId) => {
    if (!solId) return null
    return standardsOfLiving.value.find((sol) => sol.id === solId)
  }

  return {
    equipment,
    sources,
    standardsOfLiving,
    fetchAllEquipment,
    fetchAllSources,
    getSourceById,
    fetchStandardsOfLiving,
    getStandardOfLivingById,
  }
})
