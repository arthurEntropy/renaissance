import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useBaseEntityStore } from '@/stores/composables/useBaseEntityStore'
import EquipmentSubtypeService from '@/services/entities/equipment/equipmentSubtypeService'

export const useEquipmentSubtypesStore = defineStore('equipmentSubtypes', () => {
  const base = useBaseEntityStore(EquipmentSubtypeService)

  // Sorted computed property
  const equipmentSubtypes = computed(() => {
    return [...base.items.value].sort((a, b) => parseInt(a.id) - parseInt(b.id))
  })

  // Get subtypes by type
  const getSubtypesByType = (typeId) => {
    if (!typeId) return []
    return base.items.value
      .filter(subtype => subtype.typeId === typeId)
      .sort((a, b) => parseInt(a.id) - parseInt(b.id))
  }

  return {
    items: equipmentSubtypes,
    isLoading: base.isLoading,
    error: base.error,
    fetch: base.fetch,
    getById: base.getById,
    getSubtypesByType,
  }
})
