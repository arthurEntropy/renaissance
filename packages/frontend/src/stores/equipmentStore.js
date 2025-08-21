import { defineStore } from 'pinia'
import { ref } from 'vue'
import EquipmentService from '@/services/equipmentService'
import StandardOfLivingService from '@/services/standardOfLivingService'

export const useEquipmentStore = defineStore('equipment', () => {
  // state
  const equipment = ref([])
  const standardsOfLiving = ref([])

  // actions
  const fetch = async () => {
    try {
      equipment.value = await EquipmentService.getAll()
    } catch (error) {
      console.error('Error fetching equipment:', error)
    }
  }

  const fetchStandardsOfLiving = async () => {
    try {
      standardsOfLiving.value = await StandardOfLivingService.getAll()
    } catch (error) {
      console.error('Error fetching standards of living:', error)
    }
  }

  // getters
  const getById = (id) => {
    return equipment.value.find(item => item.id === id)
  }

  const getStandardOfLivingById = (solId) => {
    if (!solId) return null
    return standardsOfLiving.value.find((sol) => sol.id === solId)
  }

  return {
    equipment,
    standardsOfLiving,
    fetch,
    fetchStandardsOfLiving,
    getById,
    getStandardOfLivingById,
  }
})
