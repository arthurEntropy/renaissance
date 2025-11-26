import { defineStore } from 'pinia'
import { useCrudEntityStore } from './composables/useBaseEntityStore'
import EquipmentService from '@/services/entities/equipment/equipmentService'

export const useEquipmentStore = defineStore('equipment', () => {
  const base = useCrudEntityStore(EquipmentService, 'equipment')

  return {
    equipment: base.items,
    isLoading: base.isLoading,
    error: base.error,
    fetch: base.fetch,
    create: base.create,
    update: base.update,
    remove: base.remove,
    getById: base.getById,
  }
})
