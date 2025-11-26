import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useBaseEntityStore } from '@/stores/composables/useBaseEntityStore'
import EquipmentTypeService from '@/services/entities/equipment/equipmentTypeService'

export const useEquipmentTypesStore = defineStore('equipmentTypes', () => {
  const base = useBaseEntityStore(EquipmentTypeService)

  // Sorted computed property
  const equipmentTypes = computed(() => {
    return [...base.items.value].sort((a, b) => a.index - b.index)
  })

  return {
    items: equipmentTypes,
    isLoading: base.isLoading,
    error: base.error,
    fetch: base.fetch,
    getById: base.getById,
  }
})
