import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useCrudEntityStore } from '@/stores/composables/useBaseEntityStore'
import EquipmentRangeService from '@/services/entities/equipment/equipmentRangeService'

export const useEquipmentRangesStore = defineStore('equipmentRanges', () => {
  const base = useCrudEntityStore(EquipmentRangeService, 'equipmentRange')

  // Sorted computed property
  const equipmentRanges = computed(() => {
    return [...base.items.value].sort((a, b) => a.index - b.index)
  })

  return {
    items: equipmentRanges,
    isLoading: base.isLoading,
    error: base.error,
    fetch: base.fetch,
    getById: base.getById,
    create: base.create,
    update: base.update,
    remove: base.remove,
  }
})
