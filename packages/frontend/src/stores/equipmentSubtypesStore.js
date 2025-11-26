import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useCrudEntityStore } from '@/stores/composables/useBaseEntityStore'
import EquipmentSubtypeService from '@/services/entities/equipment/equipmentSubtypeService'

export const useEquipmentSubtypesStore = defineStore('equipmentSubtypes', () => {
  const base = useCrudEntityStore(EquipmentSubtypeService, 'equipmentSubtype')

  // Sorted computed property
  const equipmentSubtypes = computed(() => {
    return [...base.items.value].sort((a, b) => a.index - b.index)
  })

  // Get subtypes by type
  const getSubtypesByType = (typeId) => {
    if (!typeId) return []
    return base.items.value
      .filter(subtype => subtype.typeId === typeId)
      .sort((a, b) => a.index - b.index)
  }

  return {
    items: equipmentSubtypes,
    isLoading: base.isLoading,
    error: base.error,
    fetch: base.fetch,
    getById: base.getById,
    getSubtypesByType,
    create: base.create,
    update: base.update,
    remove: base.remove,
  }
})
