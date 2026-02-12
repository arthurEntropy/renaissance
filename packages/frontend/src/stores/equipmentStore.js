import { defineStore } from 'pinia'
import { useCrudEntityStore } from './composables/useBaseEntityStore'
import EquipmentService from '@/services/entities/equipment/equipmentService'

export const useEquipmentStore = defineStore('equipment', () => {
  const base = useCrudEntityStore(EquipmentService, 'equipment')

  // Convenience method to create a new custom equipment item
  const createCustomEquipment = async () => {
    const customEquipment = {
      ...EquipmentService.getDefaultEntity(),
      isCustom: true,
      name: 'New Custom Item'
    }
    return base.create(customEquipment)
  }

  return {
    equipment: base.items,
    isLoading: base.isLoading,
    error: base.error,
    fetch: base.fetch,
    create: base.create,
    createCustomEquipment,
    update: base.update,
    remove: base.remove,
    getById: base.getById,
  }
})
