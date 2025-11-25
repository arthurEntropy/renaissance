import { defineStore } from 'pinia'
import { ref } from 'vue'
import equipmentService from '@/services/entities/equipment/equipmentService'
import KeepingService from '@/services/entities/keepingService'

export const useEquipmentStore = defineStore('equipment', () => {
  // state
  const equipment = ref([])
  const keeping = ref([])

  const fetch = async () => {
    try {
      equipment.value = await equipmentService.getAll()
    } catch (err) {
      console.error('Error fetching equipment:', err)
    }
  }

  const fetchKeeping = async () => {
    try {
      const keepingData = await KeepingService.getAll()
      // Sort keeping options by cost (low to high)
      keeping.value = keepingData.sort((a, b) => a.cost - b.cost)
    } catch (error) {
      console.error('Error fetching keeping:', error)
    }
  }

  const create = async (equipment) => {
    try {
      const newEquipment = await equipmentService.create(equipment)
      equipment.value.push(newEquipment)
      return newEquipment
    } catch (error) {
      console.error('Error creating equipment:', error)
      throw error
    }
  }

  const getKeepingById = (keepingId) => {
    if (!keepingId) return null
    return keeping.value.find((keeping) => keeping.id === keepingId)
  }

  return {
    equipment,
    keeping,
    fetch,
    fetchKeeping,
    create,
    getKeepingById,
  }
})
